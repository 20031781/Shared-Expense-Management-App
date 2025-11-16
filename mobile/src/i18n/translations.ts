export type Language = 'en' | 'it';

export const translations = {
    en: {
        common: {
            ok: 'OK',
            cancel: 'Cancel',
            close: 'Close',
            confirm: 'Confirm',
            error: 'Error',
            success: 'Success',
            genericError: 'Something went wrong. Please try again.',
            pullToRefresh: 'Pull to refresh',
            settings: 'Settings',
            language: 'Language',
        },
        navigation: {
            lists: 'Lists',
            settings: 'Settings',
        },
        lists: {
            myLists: 'My Lists',
            createList: 'Create List',
            details: 'List Details',
            expensesTab: ({count}: {count: number}) => `Expenses (${count})`,
            membersTab: ({count}: {count: number}) => `Members (${count})`,
            invite: 'Share Invite',
            emptyExpenses: 'No expenses yet',
            emptyMembers: 'No members yet',
            addExpense: 'Add Expense',
            addMember: 'Add Member',
            summaryTitle: 'Expense summary',
            totalSpent: 'Total spent',
            perMember: 'Spent per member',
            filterLabel: 'Timeframe',
            filterAll: 'All',
            filter7: '7d',
            filter30: '30d',
            filter90: '90d',
            chartEmpty: 'Add expenses to unlock the chart.',
        },
        expenses: {
            newExpense: 'New Expense',
            titleLabel: 'Title',
            titlePlaceholder: 'E.g. Dinner, fuel...',
            amountLabel: 'Amount',
            notesLabel: 'Notes (optional)',
            notesPlaceholder: 'Add any additional details...',
            addReceiptCamera: 'Take Photo',
            addReceiptGallery: 'Choose Photo',
            receiptLabel: 'Receipt Photo (optional)',
            createButton: 'Create Expense',
            cancelButton: 'Cancel',
            titleRequired: 'Title is required',
            amountRequired: 'Amount must be greater than 0',
            payerLabel: 'Paid by',
            payerPlaceholder: 'Select a member',
            payerHelper: 'Select the member who actually paid the bill.',
            payerRequired: 'Please choose who paid',
            missingMembersHelper: 'Invite at least one member to log a payment.',
            createdSuccess: 'Expense created successfully',
            paidBy: ({name}: {name: string}) => `Paid by ${name}`,
            spentOn: ({date}: {date: string}) => `Spent on ${date}`,
            insertedOn: ({date}: {date: string}) => `Inserted on ${date}`,
        },
        members: {
            title: 'Add Member',
            emailLabel: 'Email',
            splitLabel: 'Split %',
            validatorLabel: 'Is validator',
            submit: 'Invite member',
            successTitle: 'Member invited',
            successBody: 'The member received the invitation.',
            emailRequired: 'Email is required',
            splitRequired: 'Split must be between 0 and 100',
            validatorHint: 'Validators can approve expenses',
        },
        settings: {
            title: 'Settings',
            languageLabel: 'Language',
            english: 'English',
            italian: 'Italian',
            languageDescription: 'Choose the language used across the application.',
        },
    },
    it: {
        common: {
            ok: 'OK',
            cancel: 'Annulla',
            close: 'Chiudi',
            confirm: 'Conferma',
            error: 'Errore',
            success: 'Successo',
            genericError: 'Qualcosa è andato storto. Riprova.',
            pullToRefresh: 'Trascina per aggiornare',
            settings: 'Impostazioni',
            language: 'Lingua',
        },
        navigation: {
            lists: 'Liste',
            settings: 'Impostazioni',
        },
        lists: {
            myLists: 'Le mie liste',
            createList: 'Crea lista',
            details: 'Dettagli lista',
            expensesTab: ({count}: {count: number}) => `Spese (${count})`,
            membersTab: ({count}: {count: number}) => `Membri (${count})`,
            invite: 'Condividi invito',
            emptyExpenses: 'Ancora nessuna spesa',
            emptyMembers: 'Ancora nessun membro',
            addExpense: 'Aggiungi spesa',
            addMember: 'Aggiungi membro',
            summaryTitle: 'Riepilogo spese',
            totalSpent: 'Totale speso',
            perMember: 'Spesa per membro',
            filterLabel: 'Intervallo',
            filterAll: 'Tutte',
            filter7: '7g',
            filter30: '30g',
            filter90: '90g',
            chartEmpty: 'Aggiungi spese per visualizzare il grafico.',
        },
        expenses: {
            newExpense: 'Nuova spesa',
            titleLabel: 'Titolo',
            titlePlaceholder: 'Es. Cena, benzina...',
            amountLabel: 'Importo',
            notesLabel: 'Note (opzionali)',
            notesPlaceholder: 'Aggiungi dettagli aggiuntivi...',
            addReceiptCamera: 'Scatta foto',
            addReceiptGallery: 'Scegli foto',
            receiptLabel: 'Foto ricevuta (opzionale)',
            createButton: 'Crea spesa',
            cancelButton: 'Annulla',
            titleRequired: 'Il titolo è obbligatorio',
            amountRequired: "L'importo deve essere maggiore di 0",
            payerLabel: 'Ha pagato',
            payerPlaceholder: 'Seleziona un membro',
            payerHelper: 'Indica il membro che ha pagato la spesa.',
            payerRequired: 'Seleziona chi ha pagato',
            missingMembersHelper: 'Invita almeno un membro per registrare la spesa.',
            createdSuccess: 'Spesa creata con successo',
            paidBy: ({name}: {name: string}) => `Pagata da ${name}`,
            spentOn: ({date}: {date: string}) => `Spesa del ${date}`,
            insertedOn: ({date}: {date: string}) => `Inserita il ${date}`,
        },
        members: {
            title: 'Aggiungi membro',
            emailLabel: 'Email',
            splitLabel: 'Percentuale',
            validatorLabel: 'È validatore',
            submit: 'Invita membro',
            successTitle: 'Invito inviato',
            successBody: "Il membro ha ricevuto l'invito.",
            emailRequired: "L'email è obbligatoria",
            splitRequired: 'La percentuale deve essere tra 0 e 100',
            validatorHint: 'I validatori possono approvare le spese',
        },
        settings: {
            title: 'Impostazioni',
            languageLabel: 'Lingua',
            english: 'Inglese',
            italian: 'Italiano',
            languageDescription: "Scegli la lingua utilizzata nell'app.",
        },
    },
};

export const availableLanguages: {code: Language; labelKey: string}[] = [
    {code: 'en', labelKey: 'settings.english'},
    {code: 'it', labelKey: 'settings.italian'},
];

const FALLBACK_LANGUAGE: Language = 'en';

const traverse = (language: Language, key: string): any => {
    const segments = key.split('.');
    let current: any = translations[language as Language];

    for (const segment of segments) {
        if (typeof current !== 'object' || current === null) {
            return undefined;
        }
        current = current[segment];
        if (current === undefined) return undefined;
    }
    return current;
};

export const translate = (language: Language, key: string, params?: Record<string, any>): string => {
    const raw = traverse(language, key) ?? traverse(FALLBACK_LANGUAGE, key);

    if (typeof raw === 'function') {
        return raw(params ?? {});
    }

    if (typeof raw !== 'string') {
        return key;
    }

    if (!params) {
        return raw;
    }

    return Object.keys(params).reduce((acc, paramKey) => {
        const value = params[paramKey];
        return acc.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value));
    }, raw);
};
