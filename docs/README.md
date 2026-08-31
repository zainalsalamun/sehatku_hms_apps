# Dokumentasi SehatKu HMS

Dokumen di folder ini menjadi acuan bersama product, Flutter, backend, QA,
DevOps, dan operasional rumah sakit.

| Dokumen | Kegunaan |
| --- | --- |
| [01-product-roadmap.md](01-product-roadmap.md) | Fase, prioritas, milestone, dan definition of done |
| [02-product-requirements.md](02-product-requirements.md) | Scope fitur dan acceptance criteria |
| [03-architecture.md](03-architecture.md) | Arsitektur sistem, modul backend, dan integrasi |
| [04-data-model.md](04-data-model.md) | Entity, relasi, status, dan aturan data |
| [05-admin-crud.md](05-admin-crud.md) | Scope dashboard CRUD dan permission |
| [06-api-guidelines.md](06-api-guidelines.md) | Konvensi request, response, error, pagination, dan idempotency |
| [07-security-compliance.md](07-security-compliance.md) | Baseline keamanan dan privacy data kesehatan |
| [08-end-to-end-simulation-guide.md](08-end-to-end-simulation-guide.md) | Panduan lengkap simulasi alur operasional End-to-End multi-role |
| [openapi.yaml](openapi.yaml) | Kontrak API OpenAPI 3.1 yang machine-readable |

## Source of truth

- Perilaku bisnis: Product Requirements dan Data Model.
- HTTP contract: `openapi.yaml`.
- Permission: Admin CRUD dan Security & Compliance.
- Delivery order: Product Roadmap.

Perubahan endpoint wajib mengubah `openapi.yaml`, contoh payload, test contract,
dan client Flutter pada pull request yang sama.
