const HUBSPOT_BASE = "https://api.hubapi.com";

function headers() {
  return {
    "Authorization": `Bearer ${process.env.HUBSPOT_API_KEY}`,
    "Content-Type": "application/json",
  };
}

async function logIfFailed(label: string, res: Response) {
  if (res.ok) return;
  const body = await res.text().catch(() => "<unreadable>");
  console.error(`[hubspot] ${label} failed: ${res.status} ${res.statusText} — ${body.slice(0, 500)}`);
}

export async function upsertContact(contact: {
  email: string;
  first_name: string;
  last_name: string;
  company?: string | null;
  event_name?: string;
}) {
  if (!process.env.HUBSPOT_API_KEY) return;
  const properties: Record<string, string> = {
    email: contact.email,
    firstname: contact.first_name,
    lastname: contact.last_name,
  };
  if (contact.company) properties.company = contact.company;
  if (contact.event_name) properties.hs_lead_status = contact.event_name;

  await fetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts/batch/upsert`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      inputs: [{ idProperty: "email", id: contact.email, properties }],
    }),
  });
}

export async function getLists(): Promise<{ id: string; name: string; size: number }[]> {
  const out: { id: string; name: string; size: number }[] = [];
  let offset: number | undefined;
  for (let page = 0; page < 20; page++) {
    const url = `${HUBSPOT_BASE}/contacts/v1/lists?count=250${offset ? `&offset=${offset}` : ""}`;
    const res = await fetch(url, { headers: headers() });
    await logIfFailed(`getLists ${url}`, res);
    if (!res.ok) break;
    const data = await res.json();
    for (const l of (data.lists ?? []) as { listId: number; name: string; metaData?: { size?: number } }[]) {
      out.push({ id: String(l.listId), name: l.name, size: l.metaData?.size ?? 0 });
    }
    if (!data["has-more"]) break;
    offset = data.offset;
  }
  console.error(`[hubspot] getLists: found ${out.length} contact list(s)`);
  return out;
}

export async function getContactsFromList(listId: string): Promise<{
  email: string; first_name: string; last_name: string; company: string | null;
}[]> {
  const out: { email: string; first_name: string; last_name: string; company: string | null }[] = [];
  let vidOffset: number | undefined;
  for (let page = 0; page < 50; page++) {
    const url = `${HUBSPOT_BASE}/contacts/v1/lists/${listId}/contacts/all?count=500&property=email&property=firstname&property=lastname&property=company${vidOffset ? `&vidOffset=${vidOffset}` : ""}`;
    const res = await fetch(url, { headers: headers() });
    await logIfFailed(`getContactsFromList /contacts/v1/lists/${listId}/contacts/all`, res);
    if (!res.ok) break;
    const data = await res.json();
    const contacts = (data.contacts ?? []) as { properties: Record<string, { value: string }> }[];
    const skippedNoEmail = contacts.filter((c) => !c.properties?.email?.value);
    console.error(`[hubspot] getContactsFromList(${listId}): page returned ${contacts.length} contact(s), ${skippedNoEmail.length} without email`);
    for (const c of contacts) {
      const email = c.properties?.email?.value ?? "";
      if (!email) continue;
      out.push({
        email,
        first_name: c.properties?.firstname?.value ?? "",
        last_name: c.properties?.lastname?.value ?? "",
        company: c.properties?.company?.value ?? null,
      });
    }
    if (!data["has-more"]) break;
    vidOffset = data["vid-offset"];
  }
  return out;
}

// Company-based segments (e.g. a HubSpot "list" built on the Company object).
// The legacy v1 Lists API above is contact-object-only — company lists live in
// the newer v3 Lists API and need a company→contact hop via the Associations API.
const COMPANY_OBJECT_TYPE_ID = "0-2";

export async function getCompanyLists(): Promise<{ id: string; name: string; size: number }[]> {
  const res = await fetch(`${HUBSPOT_BASE}/crm/v3/lists/search`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ objectTypeId: COMPANY_OBJECT_TYPE_ID, count: 250 }),
  });
  await logIfFailed("getCompanyLists /crm/v3/lists/search", res);
  if (!res.ok) return [];
  const data = await res.json();
  const lists = (data.lists ?? data.results ?? []) as Record<string, unknown>[];
  console.error(`[hubspot] getCompanyLists: found ${lists.length} company list(s)`);
  return lists.map((l) => ({
    id: String(l.listId ?? l.id),
    name: String(l.name ?? ""),
    size: Number((l.additionalProperties as Record<string, unknown> | undefined)?.hs_list_size ?? l.size ?? 0),
  }));
}

async function getCompanyIdsFromList(listId: string): Promise<string[]> {
  const ids: string[] = [];
  let after: string | undefined;
  for (let page = 0; page < 40; page++) {
    const url = `${HUBSPOT_BASE}/crm/v3/lists/${listId}/memberships${after ? `?after=${after}` : ""}`;
    const res = await fetch(url, { headers: headers() });
    await logIfFailed(`getCompanyIdsFromList /crm/v3/lists/${listId}/memberships`, res);
    if (!res.ok) break;
    const data = await res.json();
    const results = (data.results ?? []) as (string | number | { recordId: string | number })[];
    for (const r of results) ids.push(String(typeof r === "object" ? r.recordId : r));
    after = data.paging?.next?.after;
    if (!after) break;
  }
  console.error(`[hubspot] getCompanyIdsFromList(${listId}): ${ids.length} company id(s)`);
  return ids;
}

async function getContactIdsForCompany(companyId: string): Promise<string[]> {
  const ids: string[] = [];
  let after: string | undefined;
  for (let page = 0; page < 20; page++) {
    const url = `${HUBSPOT_BASE}/crm/v4/objects/companies/${companyId}/associations/contacts${after ? `?after=${after}` : ""}`;
    const res = await fetch(url, { headers: headers() });
    await logIfFailed(`getContactIdsForCompany /crm/v4/objects/companies/${companyId}/associations/contacts`, res);
    if (!res.ok) break;
    const data = await res.json();
    const results = (data.results ?? []) as { toObjectId: string | number }[];
    for (const r of results) ids.push(String(r.toObjectId));
    after = data.paging?.next?.after;
    if (!after) break;
  }
  return ids;
}

async function batchReadContacts(contactIds: string[]): Promise<{
  email: string; first_name: string; last_name: string; company: string | null;
}[]> {
  const out: { email: string; first_name: string; last_name: string; company: string | null }[] = [];
  for (let i = 0; i < contactIds.length; i += 100) {
    const chunk = contactIds.slice(i, i + 100);
    const res = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts/batch/read`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        properties: ["email", "firstname", "lastname", "company"],
        inputs: chunk.map((id) => ({ id })),
      }),
    });
    await logIfFailed("batchReadContacts /crm/v3/objects/contacts/batch/read", res);
    if (!res.ok) continue;
    const data = await res.json();
    const results = (data.results ?? []) as { id: string; properties: Record<string, string | null> }[];
    const skippedNoEmail = results.filter((c) => !c.properties?.email);
    console.error(`[hubspot] batchReadContacts: requested ${chunk.length}, got ${results.length} result(s), ${skippedNoEmail.length} without email`);
    if (skippedNoEmail.length > 0) {
      console.error(`[hubspot] contacts without email (id -> properties): ${skippedNoEmail.slice(0, 5).map((c) => `${c.id}=${JSON.stringify(c.properties)}`).join(" | ")}`);
    }
    for (const c of results) {
      const email = c.properties?.email ?? "";
      if (!email) continue;
      out.push({
        email,
        first_name: c.properties?.firstname ?? "",
        last_name: c.properties?.lastname ?? "",
        company: c.properties?.company ?? null,
      });
    }
  }
  return out;
}

export async function getContactsFromCompanyList(listId: string): Promise<{
  email: string; first_name: string; last_name: string; company: string | null;
}[]> {
  const companyIds = await getCompanyIdsFromList(listId);
  const contactIdSet = new Set<string>();
  for (const companyId of companyIds) {
    const ids = await getContactIdsForCompany(companyId);
    for (const id of ids) contactIdSet.add(id);
  }
  console.error(`[hubspot] getContactsFromCompanyList(${listId}): ${companyIds.length} companies -> ${contactIdSet.size} unique contact id(s)`);
  return batchReadContacts([...contactIdSet]);
}

// Pushing checked-in guests to HubSpot: rather than a static list (which the
// Lists API can't add members to for DYNAMIC/filter-based lists — HubSpot's
// docs say to edit the record instead), Impact Gstaad tracks event attendance
// via a multi-checkbox contact property, "Impact Gstaad Events" — each event
// is one checkbox option, and an existing HubSpot "segment" filters on
// "is one of" against this property. So attendance = adding this event's
// option value to the contact's (multi-value, semicolon-joined) property.
const EVENT_PROPERTY = "impact_gstaad_events";

function eventOptionValue(eventName: string, eventDate: string): string {
  const d = new Date(eventDate);
  const namePart = eventName.split(/\s[–-]\s/)[0].trim();
  const slug = namePart
    .toLowerCase()
    .normalize("NFKD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${slug}_${String(d.getDate()).padStart(2, "0")}_${String(d.getMonth() + 1).padStart(2, "0")}_${d.getFullYear()}`;
}

function eventOptionLabel(eventName: string, eventDate: string): string {
  const d = new Date(eventDate);
  const namePart = eventName.split(/\s[–-]\s/)[0].trim();
  return `${namePart}, ${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

// Creates the checkbox option for this event if it doesn't exist yet (matched
// by its deterministic slug, so repeat calls for the same event are no-ops).
export async function ensureEventOption(eventName: string, eventDate: string): Promise<string> {
  const value = eventOptionValue(eventName, eventDate);
  const label = eventOptionLabel(eventName, eventDate);

  const getRes = await fetch(`${HUBSPOT_BASE}/crm/v3/properties/contacts/${EVENT_PROPERTY}`, { headers: headers() });
  await logIfFailed(`ensureEventOption GET /crm/v3/properties/contacts/${EVENT_PROPERTY}`, getRes);
  if (!getRes.ok) return value;
  const prop = await getRes.json();
  const options = (prop.options ?? []) as { label: string; value: string; displayOrder: number; hidden: boolean }[];
  if (options.some((o) => o.value === value)) return value;

  const patchRes = await fetch(`${HUBSPOT_BASE}/crm/v3/properties/contacts/${EVENT_PROPERTY}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ options: [...options, { label, value, displayOrder: -1, hidden: false }] }),
  });
  await logIfFailed(`ensureEventOption PATCH /crm/v3/properties/contacts/${EVENT_PROPERTY}`, patchRes);
  return value;
}

// Adds `optionValue` to each contact's Impact Gstaad Events checkbox property,
// preserving whatever values they already have (checkbox properties are a
// single semicolon-joined string in the API, not a JSON array) — creates the
// contact if they don't exist yet in HubSpot.
export async function addContactsToEventProperty(
  contacts: { email: string; first_name: string; last_name: string }[],
  optionValue: string
): Promise<{ pushed: number }> {
  let pushed = 0;
  for (let i = 0; i < contacts.length; i += 100) {
    const chunk = contacts.slice(i, i + 100);

    const readRes = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts/batch/read`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        idProperty: "email",
        properties: ["email", EVENT_PROPERTY],
        inputs: chunk.map((c) => ({ id: c.email })),
      }),
    });
    await logIfFailed("addContactsToEventProperty batch/read", readRes);
    const existingByEmail = new Map<string, string>();
    if (readRes.ok) {
      const data = await readRes.json();
      for (const r of (data.results ?? []) as { properties: Record<string, string | null> }[]) {
        const email = r.properties?.email;
        if (email) existingByEmail.set(email.toLowerCase(), r.properties?.[EVENT_PROPERTY] ?? "");
      }
    }

    const inputs = chunk.map((c) => {
      const existing = (existingByEmail.get(c.email.toLowerCase()) ?? "")
        .split(";").map((s) => s.trim()).filter(Boolean);
      if (!existing.includes(optionValue)) existing.push(optionValue);
      return {
        idProperty: "email",
        id: c.email,
        properties: { email: c.email, firstname: c.first_name, lastname: c.last_name, [EVENT_PROPERTY]: existing.join(";") },
      };
    });

    const upsertRes = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts/batch/upsert`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ inputs }),
    });
    await logIfFailed("addContactsToEventProperty batch/upsert", upsertRes);
    if (upsertRes.ok) pushed += chunk.length;
  }
  console.error(`[hubspot] addContactsToEventProperty: pushed ${pushed}/${contacts.length} for option ${optionValue}`);
  return { pushed };
}
