import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test/test-utils';
import BudgetPeriodSelector from '../budget-periods/budget-period-selector';
import * as unifiedDataHooks from '../../hooks/use-unified-data';

// Mock the unified data hooks
vi.mock('../../hooks/use-unified-data', () => ({
  useBudgetPeriods: vi.fn(),
  useActiveBudgetPeriod: vi.fn(),
  useSetActiveBudgetPeriod: vi.fn(),
  useCreateBudgetPeriod: vi.fn(),
  useGetOrCreateCurrentBudgetPeriod: vi.fn(),
  useDataStatus: vi.fn()
}));

describe('BudgetPeriodSelector', () => {
  const mockSetActivePeriod = vi.fn();
  const mockCreatePeriod = vi.fn();
  const mockGetOrCreateCurrent = vi.fn();

  const mockPeriods = [
    {
      id: 'period-1',
      budgetId: 'test-budget-1',
      year: 2024,
      month: 12,
      name: 'December 2024',
      startDate: new Date(2024, 11, 1),
      endDate: new Date(2024, 11, 31),
      isActive: true,
      totals: { income: 1000000, expenses: 40000, allocated: 150000, available: 810000 },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'period-2',
      budgetId: 'test-budget-1',
      year: 2024,
      month: 11,
      name: 'November 2024',
      startDate: new Date(2024, 10, 1),
      endDate: new Date(2024, 10, 30),
      isActive: false,
      totals: { income: 800000, expenses: 60000, allocated: 120000, available: 620000 },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    vi.mocked(unifiedDataHooks.useBudgetPeriods).mockReturnValue({
      data: mockPeriods,
      isLoading: false,
      error: null
    });

    vi.mocked(unifiedDataHooks.useActiveBudgetPeriod).mockReturnValue({
      data: mockPeriods[0], // December 2024
      isLoading: false,
      error: null
    });

    vi.mocked(unifiedDataHooks.useSetActiveBudgetPeriod).mockReturnValue({
      mutateAsync: mockSetActivePeriod,
      isPending: false,
      error: null
    });

    vi.mocked(unifiedDataHooks.useCreateBudgetPeriod).mockReturnValue({
      mutateAsync: mockCreatePeriod,
      isPending: false,
      error: null
    });

    vi.mocked(unifiedDataHooks.useGetOrCreateCurrentBudgetPeriod).mockReturnValue({
      mutateAsync: mockGetOrCreateCurrent,
      isPending: false,
      error: null
    });

    vi.mocked(unifiedDataHooks.useDataStatus).mockReturnValue({
      isLoading: false,
      hasError: false,
      isInitialized: true,
      isHealthy: true
    });
  });

  describe('Basic Rendering', () => {
    it('should render with active period', async () => {
      render(<BudgetPeriodSelector />);

      await waitFor(() => {
        expect(screen.getByText('December 2024')).toBeInTheDocument();
      });

      expect(screen.getByText('Allocate sats')).toBeInTheDocument();
    });

    it('should show navigation buttons', async () => {
      render(<BudgetPeriodSelector />);

      await waitFor(() => {
        expect(screen.getByText('December 2024')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });
  });

  describe('Period Creation', () => {
    it('should create new period when button is clicked', async () => {
      const user = userEvent.setup();
      render(<BudgetPeriodSelector />);

      await waitFor(() => {
        expect(screen.getByText('December 2024')).toBeInTheDocument();
      });

      const createButton = screen.getByText('New Period');
      await user.click(createButton);

      expect(mockGetOrCreateCurrent).toHaveBeenCalled();
    });
  });
}); 