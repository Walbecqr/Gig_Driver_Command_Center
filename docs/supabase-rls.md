# Supabase Row Level Security (RLS) Notes

- Protect user data with `auth.uid()` policies in Supabase.
- Example for shifts:

```sql
create policy "Users can access their shifts"
  on shifts
  for select, insert, update, delete
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

- All tables that store user-specific data should enforce `user_id = auth.uid()`.
- `delivery_platform_accounts`, `offers`, `deliveries`, `expenses`, `cash_ledger_entries`, `incidents` should be covered.
- Never store plaintext platform credentials. Encrypt or use only tokens with encryption.
