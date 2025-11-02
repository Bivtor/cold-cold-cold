import { writable } from 'svelte/store';

interface LoadingState {
    [key: string]: boolean;
}

function createLoadingStore() {
    const { subscribe, update } = writable<LoadingState>({});

    return {
        subscribe,

        /**
         * Set loading state for a specific operation
         */
        set: (operation: string, isLoading: boolean) => {
            update(state => ({
                ...state,
                [operation]: isLoading
            }));
        },

        /**
         * Start loading for an operation
         */
        start: (operation: string) => {
            update(state => ({
                ...state,
                [operation]: true
            }));
        },

        /**
         * Stop loading for an operation
         */
        stop: (operation: string) => {
            update(state => ({
                ...state,
                [operation]: false
            }));
        },

        /**
         * Check if any operation is loading
         */
        isAnyLoading: (state: LoadingState) => {
            return Object.values(state).some(loading => loading);
        },

        /**
         * Clear all loading states
         */
        clear: () => {
            update(() => ({}));
        }
    };
}

export const loading = createLoadingStore();

// Common loading operation keys
export const LoadingOperations = {
    SCRAPING: 'scraping',
    GENERATING_EMAIL: 'generating_email',
    SENDING_EMAIL: 'sending_email',
    SAVING_SETTINGS: 'saving_settings',
    LOADING_HISTORY: 'loading_history',
    UPDATING_STATUS: 'updating_status',
    SAVING_NOTE: 'saving_note',
    DELETING_NOTE: 'deleting_note'
} as const;