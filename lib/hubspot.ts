const HUBSPOT_BASE = "https://api.hubapi.com";

function headers() {
  return {
    "Authorization": `Bearer ${process.env.HUBSPOT_API_KEY}`,
    "Content-Type": "application/json",
  };
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
  const res = await fetch(
    `${HUBSPOT_BASE}/contacts/v1/lists?count=250`,
    { headers: headers() }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.lists ?? []).map((l: { listId: number; name: string; metaData?: { size?: number } }) => ({
    id: String(l.listId),
    name: l.name,
    size: l.metaData?.size ?? 0,
  }));
}

export async function getContactsFromList(listId: string): Promise<{
  email: string; first_name: string; last_name: string; company: string | null;
}[]> {
  const res = await fetch(
    `${HUBSPOT_BASE}/contacts/v1/lists/${listId}/contacts/all?count=500&property=email&property=firstname&property=lastname&property=company`,
    { headers: headers() }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const contacts = data.contacts ?? [];
  return contacts
    .map((c: { properties: Record<string, { value: string }> }) => ({
      email: c.properties?.email?.value ?? "",
      first_name: c.properties?.firstname?.value ?? "",
      last_name: c.properties?.lastname?.value ?? "",
      company: c.properties?.company?.value ?? null,
    }))
    .filter((c: { email: string }) => c.email);
}
