# Ekspor workflow live n8n

Salinan definisi workflow live (`nodes`, `connections`, `settings`), disalin dari keluaran MCP `get_workflow_details`. Nama file memakai `versionId` n8n.

| File | Workflow | versionId (= activeVersionId saat diambil) | Diambil |
|---|---|---|---|
| `ingest.c0089503-….json` | 1. Ingest `qbvS8aQsVwvHzURm` | `c0089503-e9ca-42f9-8101-bcc76a62a059` | 9 Okt 2026 ±00:50 WIB |
| `publish.dff4c706-….json` | 2. Publish `JYX8Kd4ZX2JuLSkH` | `dff4c706-1b1e-456d-9b73-385e4134265a` | 9 Okt 2026 ±00:50 WIB |

Rollback utama memakai riwayat versi n8n: `restore_workflow_version` ke `versionId` di atas, lalu Publish. File JSON ini adalah cadangan kedua untuk impor manual. File ini hanya berisi ID dan nama credential, tanpa nilai rahasia.
