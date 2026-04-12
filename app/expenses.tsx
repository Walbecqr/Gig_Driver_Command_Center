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
  getExpensesForUser,
  addExpense,
  deleteExpense,
  type AddExpenseInput,
} from '@/features/expenses';
import type { Expense } from '@/types/entities';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: Expense['category'][] = ['fuel', 'parking', 'food', 'vehicle', 'taxi', 'other'];

const CATEGORY_LABELS: Record<Expense['category'], string> = {
  fuel: 'Fuel',
  parking: 'Parking',
  food: 'Food',
  vehicle: 'Vehicle',
  taxi: 'Taxi',
  other: 'Other',
};

const CATEGORY_COLORS: Record<Expense['category'], string> = {
  fuel: '#F59E0B',
  parking: '#6366F1',
  food: '#10B981',
  vehicle: '#EF4444',
  taxi: '#3B82F6',
  other: colors.textMuted,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Add expense form
// ---------------------------------------------------------------------------

function AddExpenseForm({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [visible, setVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('fuel');
  const [notes, setNotes] = useState('');

  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (input: AddExpenseInput) => addExpense(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
      setAmount('');
      setNotes('');
      setCategory('fuel');
      setVisible(false);
      onSaved();
    },
    onError: () => Alert.alert('Error', 'Could not save expense.'),
  });

  if (!visible) {
    return (
      <TouchableOpacity style={styles.addBtn} onPress={() => setVisible(true)}>
        <Text style={styles.addBtnText}>+ Log Expense</Text>
      </TouchableOpacity>
    );
  }

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid amount', 'Enter a positive dollar amount.');
      return;
    }
    mutate({ userId, category, amount: parsedAmount, notes: notes || undefined });
  };

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Log Expense</Text>

      <Text style={styles.label}>Category</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, category === c && { backgroundColor: CATEGORY_COLORS[c] }]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>
              {CATEGORY_LABELS[c]}
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

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Fill-up at Shell on Main St"
        value={notes}
        onChangeText={setNotes}
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
// Expense row
// ---------------------------------------------------------------------------

function ExpenseRow({
  expense,
  onDelete,
}: {
  expense: Expense;
  onDelete: (id: string) => void;
}) {
  const color = CATEGORY_COLORS[expense.category];

  const handleDelete = () => {
    Alert.alert('Delete expense?', `$${expense.amount.toFixed(2)} · ${CATEGORY_LABELS[expense.category]}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(expense.id) },
    ]);
  };

  return (
    <View style={styles.row}>
      <View style={[styles.categoryDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowCategory}>{CATEGORY_LABELS[expense.category]}</Text>
        {expense.notes ? (
          <Text style={styles.rowNotes} numberOfLines={1}>{expense.notes}</Text>
        ) : null}
        <Text style={styles.rowDate}>{fmtDate(expense.occurredAt)}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowAmount}>-${expense.amount.toFixed(2)}</Text>
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

export default function ExpensesScreen() {
  const userId = useAppStore((s) => s.userId) ?? 'local';
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', userId],
    queryFn: () => getExpensesForUser(userId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses', userId] }),
    onError: () => Alert.alert('Error', 'Could not delete expense.'),
  });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <ScreenShell title="Expenses" subtitle="Log and categorise driver expenses">

      <AddExpenseForm userId={userId} onSaved={() => {}} />

      {expenses.length > 0 && (
        <View style={styles.totalBanner}>
          <Text style={styles.totalLabel}>Total logged</Text>
          <Text style={styles.totalAmount}>-${total.toFixed(2)}</Text>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : expenses.length === 0 ? (
        <Text style={styles.empty}>No expenses logged yet.</Text>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => (
            <ExpenseRow expense={item} onDelete={(id) => deleteMutation.mutate(id)} />
          )}
          scrollEnabled={false}
        />
      )}

    </ScreenShell>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: typography.fontSizeXs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeightMedium,
  },
  chipTextActive: {
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
  totalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  totalLabel: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
  },
  totalAmount: {
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightBold,
    color: colors.error,
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
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowCategory: {
    fontSize: typography.fontSizeMd,
    fontWeight: typography.fontWeightMedium,
    color: colors.textPrimary,
  },
  rowNotes: {
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
    color: colors.error,
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
