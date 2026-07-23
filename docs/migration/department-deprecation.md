# Department 废弃说明

> 状态：**已完成**（Phase 1）  
> 相关：[领域与安全](../architecture/domain-and-security.md) · [roadmap Phase 1](../implementation/roadmap.md)

## 结论

- 业务组织树以 **`Organization`** 为准（含 `type=DEPARTMENT`）。
- Prisma 已删除 `Department` / `UserDepartment`；成员关系统一为 `UserOrganization`。
- 迁移脚本：`apps/api/prisma/migrations/20260722140000_session_membership_dept_merge/`。

## 已完成项

1. `Department` → `Organization(type=department)` 映射（冲突 code 合并到既有 Organization）。
2. `UserDepartment` → `UserOrganization`（`isPrimary` 语义保留，并保证每用户至多一个主职）。
3. 按 `parent_id` 重建全部 Organization `path` / `level`。
4. 应用层查询已改为 `organizations` include，不再引用 `departments`。

## 历史原则（归档）

- 一对一映射：`Department` → `Organization(type=department)`，保留 code/name/parent。
- 成员：`UserDepartment.isPrimary` → `UserOrganization.isPrimary`。
- path/level 按 Organization 规则重算。
