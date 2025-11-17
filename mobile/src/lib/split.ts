import {Expense, ListMember} from '@/types';

export type SplitRow = {
    member: ListMember;
    share: number;
    paid: number;
    net: number;
    percentage: number;
};

export type SplitSettlement = {
    from: ListMember;
    to: ListMember;
    amount: number;
};

export type SplitSummary = {
    rows: SplitRow[];
    settlements: SplitSettlement[];
    reason: 'no-expenses' | 'no-members' | 'no-split' | null;
};

export const buildSplitSummary = (expenses: Expense[], members: ListMember[]): SplitSummary => {
    if (expenses.length === 0) {
        return {rows: [], settlements: [], reason: 'no-expenses'};
    }
    const membersWithSplit = members.filter(member => (member.splitPercentage ?? 0) > 0);
    if (membersWithSplit.length === 0) {
        return {rows: [], settlements: [], reason: 'no-members'};
    }

    const memberLookup = new Map(membersWithSplit.map(member => [member.id, member] as const));
    const paidMap = new Map<string, number>();
    const shareMap = new Map<string, number>();

    expenses.forEach(expense => {
        if (expense.paidByMemberId) {
            paidMap.set(
                expense.paidByMemberId,
                (paidMap.get(expense.paidByMemberId) ?? 0) + expense.amount,
            );
        }

        const beneficiaries = (expense.beneficiaryMemberIds?.length
            ? expense.beneficiaryMemberIds
            : membersWithSplit.map(member => member.id))
            .map(id => memberLookup.get(id))
            .filter((member): member is ListMember => !!member);

        const scopedBeneficiaries = beneficiaries.length > 0 ? beneficiaries : membersWithSplit;
        const totalWeight = scopedBeneficiaries.reduce((sum, member) => sum + (member.splitPercentage ?? 0), 0);

        scopedBeneficiaries.forEach(member => {
            const weight = totalWeight > 0
                ? (member.splitPercentage ?? 0) / totalWeight
                : 1 / scopedBeneficiaries.length;
            shareMap.set(member.id, (shareMap.get(member.id) ?? 0) + expense.amount * weight);
        });
    });

    const hasShare = Array.from(shareMap.values()).some(value => value > 0);
    if (!hasShare) {
        return {rows: [], settlements: [], reason: 'no-split'};
    }

    const rows: SplitRow[] = membersWithSplit
        .map(member => {
            const percentage = member.splitPercentage ?? 0;
            const share = shareMap.get(member.id) ?? 0;
            const paid = paidMap.get(member.id) ?? 0;
            const net = paid - share;
            return {member, share, paid, net, percentage};
        })
        .sort((a, b) => b.net - a.net);

    const creditors = rows.filter(row => row.net > 0).map(row => ({member: row.member, amount: row.net}));
    const debtors = rows.filter(row => row.net < 0).map(row => ({member: row.member, amount: Math.abs(row.net)}));
    const settlements: SplitSettlement[] = [];

    let creditorIndex = 0;
    let debtorIndex = 0;
    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
        const creditor = creditors[creditorIndex];
        const debtor = debtors[debtorIndex];
        const amount = Math.min(creditor.amount, debtor.amount);
        settlements.push({from: debtor.member, to: creditor.member, amount});
        creditor.amount -= amount;
        debtor.amount -= amount;
        if (creditor.amount < 0.01) creditorIndex++;
        if (debtor.amount < 0.01) debtorIndex++;
    }

    return {rows, settlements, reason: null};
};
