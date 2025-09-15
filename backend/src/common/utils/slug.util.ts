import { Repository, ObjectLiteral } from 'typeorm';

export async function generateUniqueSlug<T extends ObjectLiteral>(
  repo: Repository<T>,
  name: string,
  field: keyof T = 'slug' as keyof T
): Promise<string> {
  // slug cơ bản từ name
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  let slug = baseSlug;
  let counter = 1;

  // check trong DB để tránh trùng
  while (
    await repo.findOne({
      where: { [field]: slug } as any, // hoặc cast sang Partial<T>
    })
  ) {
    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
}
