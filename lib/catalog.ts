import { DEPARTMENTS, type Department } from "@/lib/departments";

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function findDepartmentBySlug(slug: string): Department | null {
  return DEPARTMENTS.find((department) => slugify(department.name) === slug) ?? null;
}

export function findCategoryBySlug(
  departmentName: string,
  slug: string
): string | null {
  const department = DEPARTMENTS.find(
    (item) => slugify(item.name) === slugify(departmentName)
  );

  return (
    department?.categories.find((category) => slugify(category) === slug) ?? null
  );
}

export function departmentPath(departmentName: string): string {
  return `/departamento/${slugify(departmentName)}`;
}

export function categoryPath(
  departmentName: string,
  categoryName: string
): string {
  return `${departmentPath(departmentName)}/${slugify(categoryName)}`;
}

export function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
