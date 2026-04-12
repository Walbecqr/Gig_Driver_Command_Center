import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import ScreenShell from '@/components/ScreenShell';
import { colors, spacing, typography, radius } from '@/lib/tokens';
import { useAppStore } from '@/state/appStore';
import {
  getLedgerForUser,
  addLedgerEntry,
  deleteLedgerEntry,
  computeBalance,
  type AddLedgerEntryInput,
} from '@/features/cash';
import type { CashLedgerEntry } from '@/types/entities';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<CashLedgerEntry['type'], string> = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  adjustment: 'Adjustment',
};

const TYPE_COLORS: Record<CashLedgerEntry['type'], string> = {
  deposit: colors.success,
  withdrawal: colors.error,
  adjustment: colors.info,
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function signedAmount(entry: CashLedgerEntry): string {
  const sign = entry.type === 'deposit' ? '+' : entry.type === 'withdrawal' ? '-' : '';
  return `${sign}$${entry.amount.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Add entry form
// ---------------------------------------------------------------------------

function AddEntryForm({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState<CashLedgerEntry['type']>('deposit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (input: AddLedgerEntryInput) => addLedgerEntry(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash', userId] });
      setAmount('');
      setNote('');
      setType('deposit');
      setVisible(false);
      onSaved();
    },
    onError: () => Alert.alert('Error', 'Could not save entry.'),
  });

  if (!visible) {
    return (
      <TouchableOpacity style={styles.addBtn} onPress={() => setVisible(true)}>
        <Text style={styles.addBtnText}>+ Add Entry</Text>
      </TouchableOpacity>
    );
  }

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid amount', 'Enter a positive dollar amount.');
      return;
    }
    mutate({ userId, type, amount: parsedAmount, note: note || undefined });
  };

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Add Ledger Entry</Text>

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeTabs}>
        {(['deposit', 'withdrawal', 'adjustment'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeTab, type === t && { backgroundColor: TYPE_COLORS[t] }]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.typeTabText, type === t && styles.typeTabTextActive]}>
              {TYPE_LABELS[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Amount ($)</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        returnKeyType="done"
      />

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Customer cash tip"
        value={note}
        onChangeText={setNote}
        returnKeyType="done"
      />

      <View style={styles.formActions}>
        <TouchableOpacity
          style={[styles.btn, styles.btnGhost]}
          onPress={() => setVisible(false)}
        >
          <Text style={[styles.btnText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, isPending && styles.disabled]}
          disabled={isPending}
          onPress={handleSave}
        >
          {isPending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.btnText}>Save</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Ledger row
// ---------------------------------------------------------------------------

function LedgerRow({
  entry,
  onDelete,
}: {
  entry: CashLedgerEntry;
  onDelete: (id: string) => void;
}) {
  const color = TYPE_COLORS[entry.type];

  const handleDelete = () => {
    Alert.alert(
      'Delete entry?',
      `${signedAmount(entry)} · ${TYPE_LABELS[entry.type]}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(entry.id) },
      ],
    );
  };

  return (
    <View style={styles.row}>
      <View style={[styles.typeDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowType}>{TYPE_LABELS[entry.type]}</Text>
        {entry.note ? (
          <Text style={styles.rowNote} numberOfLines={1}>{entry.note}</Text>
        ) : null}
        <Text style={styles.rowDate}>{fmtDate(entry.createdAt)}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowAmount, { color }]}>{signedAmount(entry)}</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function CashScreen() {
  const userId = useAppStore((s) => s.userId) ?? 'local';
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['cash', userId],
    queryFn: () => getLedgerForUser(userId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLedgerEntry(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cash', userId] }),
    onError: () => Alert.alert('Error', 'Could not delete entry.'),
  });

  const balance = computeBalance(entries);
  const balanceColor = balance >= 0 ? colors.success : colors.error;

  return (
    <ScreenShell title="Cash On Hand" subtitle="Track deposits, withdrawals, and ledger balance">

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={[styles.balanceAmount, { color: balanceColor }]}>
          {balance < 0 ? '-' : ''}${Math.abs(balance).toFixed(2)}
        </Text>
      </View>

      <AddEntryForm userId={userId} onSaved={() => {}} />

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : entries.length === 0 ? (
        <Text style={styles.empty}>No ledger entries yet.</Text>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Ledger</Text>
          <FlatList
            data={entries}
            keyExtractor={(e) => e.id}
            renderItem={({ item }) => (
              <LedgerRow entry={item} onDelete={(id) => deleteMutation.mutate(id)} />
            )}
            scrollEnabled={false}
          />
        </>
      )}

    </ScreenShell>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  balanceLabel: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: typography.fontSizeDisplay,
    fontWeight: typography.fontWeightBold,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: typography.fontWeightSemibold,
    fontSize: typography.fontSizeMd,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  formTitle: {
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  typeTabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  typeTab: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeTabText: {
    fontSize: typography.fontSizeXs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeightMedium,
  },
  typeTabTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSizeMd,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    marginTop: spacing.xs,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnGhost: { borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.5 },
  btnText: {
    color: '#fff',
    fontWeight: typography.fontWeightSemibold,
    fontSize: typography.fontSizeSm,
  },
  sectionTitle: {
    fontSize: typography.fontSizeMd,
    fontWeight: typography.fontWeightSemibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  typeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowType: {
    fontSize: typography.fontSizeMd,
    fontWeight: typography.fontWeightMedium,
    color: colors.textPrimary,
  },
  rowNote: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowDate: {
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rowAmount: {
    fontSize: typography.fontSizeMd,
    fontWeight: typography.fontWeightSemibold,
  },
  deleteBtn: {
    padding: 2,
  },
  deleteBtnText: {
    fontSize: 18,
    color: colors.textMuted,
    lineHeight: 18,
  },
  empty: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeMd,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
