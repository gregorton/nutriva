import "server-only";
import { query, queryOne, tx } from "@/lib/db";

/*
  The address book behind /account/addresses.

  It is a convenience, not a record: an order snapshots the address it shipped to (see
  lib/schema/005_orders.sql), so editing or deleting an entry here cannot rewrite where a past
  parcel went. Nothing else reads it yet — the checkout still asks, because its form is a client
  island on a page open to guests, and wiring it up is a separate job.
*/

export type AddressValue = {
  label: string | null;
  name: string;
  phone: string;
  line: string;
  subdistrict: string;
  district: string;
  province: string;
  postcode: string;
};

export type Address = AddressValue & { id: string; isDefault: boolean };

type AddressRow = {
  id: string;
  label: string | null;
  name: string;
  phone: string;
  line: string;
  subdistrict: string;
  district: string;
  province: string;
  postcode: string;
  is_default: boolean;
};

const COLUMNS =
  "id, label, name, phone, line, subdistrict, district, province, postcode, is_default";

function toAddress(row: AddressRow): Address {
  return {
    id: row.id,
    label: row.label,
    name: row.name,
    phone: row.phone,
    line: row.line,
    subdistrict: row.subdistrict,
    district: row.district,
    province: row.province,
    postcode: row.postcode,
    isDefault: row.is_default,
  };
}

/** Default first, then newest. The default is what a delivery form would reach for. */
export function addressesFor(userId: string): Promise<Address[]> {
  return query<AddressRow>(
    `select ${COLUMNS} from addresses
      where user_id = $1
      order by is_default desc, created_at desc`,
    [userId],
  ).then((rows) => rows.map(toAddress));
}

/** One entry, scoped to its owner: an id from a form field is not proof of anything. */
export function addressFor(userId: string, id: string): Promise<Address | null> {
  return queryOne<AddressRow>(
    `select ${COLUMNS} from addresses where user_id = $1 and id = $2::uuid`,
    [userId, id],
  ).then((row) => (row ? toAddress(row) : null));
}

/*
  Insert or update, in one transaction with the default it may claim.

  `id` null is a new entry; an id given is updated only where it already belongs to this account, so
  a forged id writes nothing rather than somebody else's row. The first address an account saves
  becomes the default whether or not it was asked for, because a book of one with no default is a
  book a delivery form cannot read.

  Clearing the other defaults first is what keeps `addresses_one_default` satisfied. The index is
  the real rule; this is only the order that does not trip it.
*/
export async function saveAddress(
  userId: string,
  id: string | null,
  value: AddressValue,
  makeDefault: boolean,
): Promise<string | null> {
  return tx(async (client) => {
    const first =
      (await client.query<{ n: number }>(
        "select count(*)::int as n from addresses where user_id = $1",
        [userId],
      )).rows[0].n === 0;
    const isDefault = makeDefault || first;

    if (isDefault) {
      await client.query(
        "update addresses set is_default = false where user_id = $1 and is_default",
        [userId],
      );
    }

    const params = [
      userId,
      value.label,
      value.name,
      value.phone,
      value.line,
      value.subdistrict,
      value.district,
      value.province,
      value.postcode,
      isDefault,
    ];

    if (id) {
      const updated = await client.query<{ id: string }>(
        `update addresses
            set label = $2, name = $3, phone = $4, line = $5, subdistrict = $6,
                district = $7, province = $8, postcode = $9, is_default = $10,
                updated_at = now()
          where user_id = $1 and id = $11::uuid
        returning id`,
        [...params, id],
      );
      return updated.rows[0]?.id ?? null;
    }

    const inserted = await client.query<{ id: string }>(
      `insert into addresses
         (user_id, label, name, phone, line, subdistrict, district, province, postcode, is_default)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       returning id`,
      params,
    );
    return inserted.rows[0].id;
  });
}

/*
  Deleting the default promotes the newest of what is left, so an account never ends up with
  several addresses and no default. Both statements are one transaction for the same reason
  `saveAddress` is.
*/
export async function deleteAddress(userId: string, id: string): Promise<void> {
  await tx(async (client) => {
    const gone = await client.query<{ is_default: boolean }>(
      "delete from addresses where user_id = $1 and id = $2::uuid returning is_default",
      [userId, id],
    );
    if (!gone.rows[0]?.is_default) return;

    await client.query(
      `update addresses set is_default = true
        where id = (select id from addresses where user_id = $1
                     order by created_at desc limit 1)`,
      [userId],
    );
  });
}

export async function setDefaultAddress(userId: string, id: string): Promise<void> {
  await tx(async (client) => {
    const owned = await client.query<{ id: string }>(
      "select id from addresses where user_id = $1 and id = $2::uuid",
      [userId, id],
    );
    if (owned.rows.length === 0) return;

    await client.query("update addresses set is_default = false where user_id = $1 and is_default", [
      userId,
    ]);
    await client.query("update addresses set is_default = true where id = $1::uuid", [id]);
  });
}
