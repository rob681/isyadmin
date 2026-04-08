import { createClient } from "@supabase/supabase-js";

let supabase: ReturnType<typeof createClient> | null = null;
const ensuredBuckets = new Set<string>();

function getClient() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase credentials not configured");
    supabase = createClient(url, key);
  }
  return supabase;
}

async function ensureBucket(client: ReturnType<typeof createClient>, bucket: string) {
  if (ensuredBuckets.has(bucket)) return;
  const { data } = await client.storage.getBucket(bucket);
  if (!data) {
    await client.storage.createBucket(bucket, { public: false });
  }
  ensuredBuckets.add(bucket);
}

export async function uploadFile(
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<{ storagePath: string; url: string }> {
  const client = getClient();
  await ensureBucket(client, bucket);

  const { error } = await client.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: false,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = client.storage.from(bucket).getPublicUrl(path);

  return {
    storagePath: `${bucket}/${path}`,
    url: urlData.publicUrl,
  };
}

export async function downloadFile(bucket: string, path: string): Promise<Buffer> {
  const client = getClient();
  const { data, error } = await client.storage.from(bucket).download(path);
  if (error || !data) throw new Error(`Download failed: ${error?.message}`);
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function deleteFile(storagePath: string): Promise<void> {
  const client = getClient();
  const [bucket, ...pathParts] = storagePath.split("/");
  const path = pathParts.join("/");

  await client.storage.from(bucket).remove([path]);
}
