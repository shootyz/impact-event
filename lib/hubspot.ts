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
