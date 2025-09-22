import axios, { AxiosInstance } from 'axios';
import { GraphQLClient } from 'graphql-request';

export interface LoginResponse {
  token: string;
  user: any;
  errors?: string[];
}

export interface Account {
  id: string;
  displayName: string;
  currentBalance: number;
  includeInNetWorth: boolean;
  type: {
    name: string;
    group: string;
  };
  institution?: {
    name: string;
  };
}

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  plaidName?: string;
  notes?: string;
  pending?: boolean;
  category?: {
    id: string;
    name: string;
  };
  merchant?: {
    id: string;
    name: string;
  };
  account: {
    id: string;
    displayName: string;
  };
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  remaining: number;
}

export class MonarchMoneyAPI {
  private static baseURL = 'https://api.monarchmoney.com';
  private graphQLClient: GraphQLClient;
  private token: string;

  constructor(token = process.env.MONARCH_TOKEN) {
    if (!token) {
      throw new Error(
        'MONARCH_TOKEN environment variable is required. Please set it to your Monarch Money authentication token.'
      );
    }

    this.token = token;

    this.graphQLClient = new GraphQLClient(
      `${MonarchMoneyAPI.baseURL}/graphql`,
      {
        headers: {
          Authorization: `Token ${this.token}`,
        },
      }
    );
  }

  private ensureAuthenticated(): void {
    if (!this.token || !this.graphQLClient) {
      throw new Error(
        'Authentication failed. Please check your MONARCH_TOKEN environment variable.'
      );
    }
  }

  static async login(
    username: string,
    password: string,
    mfaCode?: string
  ): Promise<LoginResponse> {
    try {
      const httpClient = axios.create({
        baseURL: MonarchMoneyAPI.baseURL,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const response = await httpClient.post('/auth/login/', {
        username,
        password,
        totp: mfaCode,
        supports_mfa: true,
        trusted_device: false,
      });

      if (response.data.token) {
        return {
          token: response.data.token,
          user: response.data.user,
        };
      }

      throw new Error('Invalid credentials');
    } catch (error: any) {
      throw new Error(
        `Login failed: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async getAccounts(): Promise<Account[]> {
    this.ensureAuthenticated();

    const query = `
          query GetAccounts {
            accounts {
              ...AccountFields
              __typename
            }
            householdPreferences {
              id
              accountGroupOrder
              __typename
            }
          }

          fragment AccountFields on Account {
            id
            displayName
            syncDisabled
            deactivatedAt
            isHidden
            isAsset
            mask
            createdAt
            updatedAt
            displayLastUpdatedAt
            currentBalance
            displayBalance
            includeInNetWorth
            hideFromList
            hideTransactionsFromReports
            includeBalanceInNetWorth
            includeInGoalBalance
            dataProvider
            dataProviderAccountId
            isManual
            transactionsCount
            holdingsCount
            manualInvestmentsTrackingMethod
            order
            logoUrl
            type {
              display
              group
              name
              __typename
            }
            subtype {
              name
              display
              __typename
            }
            credential {
              id
              updateRequired
              disconnectedFromDataProviderAt
              dataProvider
              institution {
                id
                plaidInstitutionId
                name
                status
                __typename
              }
              __typename
            }
            institution {
              id
              name
              primaryColor
              url
              __typename
            }
            __typename
          }
    `;

    try {
      const data: any = await this.graphQLClient.request(query);
      return data.accounts || [];
    } catch (error: any) {
      if (
        error.message.includes('401') ||
        error.message.includes('unauthorized')
      ) {
        throw new Error(
          'Authentication failed. Please check your MONARCH_TOKEN environment variable.'
        );
      }
      throw new Error(`Failed to get accounts: ${error.message}`);
    }
  }

  async getTransactions(
    options: {
      limit?: number;
      accountId?: string;
      startDate?: string;
      endDate?: string;
      offset?: number;
    } = {}
  ): Promise<Transaction[]> {
    this.ensureAuthenticated();

    const { limit = 100, accountId, startDate, endDate, offset = 0 } = options;

    const query = `
      query GetTransactionsList($offset: Int, $limit: Int, $filters: TransactionFilterInput, $orderBy: TransactionOrdering) {
        allTransactions(filters: $filters) {
          totalCount
          results(offset: $offset, limit: $limit, orderBy: $orderBy) {
            id
            amount
            pending
            date
            plaidName
            notes
            category {
              id
              name
              __typename
            }
            merchant {
              name
              id
              __typename
            }
            account {
              id
              displayName
            }
            __typename
          }
          __typename
        }
      }
    `;

    const variables: any = {
      offset,
      limit,
      filters: {},
      orderBy: 'date',
    };

    if (accountId) variables.filters.accountId = accountId;
    if (startDate) variables.filters.startDate = startDate;
    if (endDate) variables.filters.endDate = endDate;

    try {
      const data: any = await this.graphQLClient.request(query, variables);
      return data.allTransactions?.results || [];
    } catch (error: any) {
      if (
        error.message.includes('401') ||
        error.message.includes('unauthorized')
      ) {
        throw new Error(
          'Authentication failed. Please check your MONARCH_TOKEN environment variable.'
        );
      }
      throw new Error(`Failed to get transactions: ${error.message}`);
    }
  }

  async getBudgets(): Promise<Budget[]> {
    this.ensureAuthenticated();

    const query = `
      query Common_GetJointPlanningData($startDate: Date!, $endDate: Date!) {
        budgetSystem
        budgetData(startMonth: $startDate, endMonth: $endDate) {
          monthlyAmountsByCategory {
            category {
              id
              name
              __typename
            }
            monthlyAmounts {
              month
              plannedAmount
              actualAmount
              __typename
            }
            __typename
          }
          __typename
        }
      }
    `;

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    try {
      const data: any = await this.graphQLClient.request(query, {
        startDate,
        endDate,
      });
      const categoryData = data.budgetData?.monthlyAmountsByCategory || [];

      return categoryData.map((catData: any) => {
        const currentMonth = catData.monthlyAmounts?.find(
          (ma: any) => ma.month === startDate.substring(0, 7)
        );
        return {
          id: catData.category?.id,
          name: catData.category?.name,
          amount: currentMonth?.plannedAmount || 0,
          spent: currentMonth?.actualAmount || 0,
          remaining:
            (currentMonth?.plannedAmount || 0) -
            (currentMonth?.actualAmount || 0),
        };
      });
    } catch (error: any) {
      if (
        error.message.includes('401') ||
        error.message.includes('unauthorized')
      ) {
        throw new Error(
          'Authentication failed. Please check your MONARCH_TOKEN environment variable.'
        );
      }
      throw new Error(`Failed to get budgets: ${error.message}`);
    }
  }

  async getCategories(): Promise<any[]> {
    this.ensureAuthenticated();

    const query = `
      query GetCategories {
        categories {
          id
          name
          systemCategory
          group {
            id
            name
          }
        }
      }
    `;

    try {
      const data: any = await this.graphQLClient.request(query);
      return data.categories || [];
    } catch (error: any) {
      if (
        error.message.includes('401') ||
        error.message.includes('unauthorized')
      ) {
        throw new Error(
          'Authentication failed. Please check your MONARCH_TOKEN environment variable.'
        );
      }
      throw new Error(`Failed to get categories: ${error.message}`);
    }
  }

  async getAccountSnapshots(
    accountId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any[]> {
    this.ensureAuthenticated();

    let filters = `accountId: "${accountId}"`;
    if (startDate) {
      filters += `, startDate: "${startDate}"`;
    }
    if (endDate) {
      filters += `, endDate: "${endDate}"`;
    }

    const query = `
      query GetAccountSnapshots {
        accountSnapshots(filters: {${filters}}) {
          date
          balance
          signedBalance
        }
      }
    `;

    try {
      const data: any = await this.graphQLClient.request(query);
      return data.accountSnapshots || [];
    } catch (error: any) {
      if (
        error.message.includes('401') ||
        error.message.includes('unauthorized')
      ) {
        throw new Error(
          'Authentication failed. Please check your MONARCH_TOKEN environment variable.'
        );
      }
      throw new Error(`Failed to get account snapshots: ${error.message}`);
    }
  }

  isAuthenticated(): boolean {
    return !!(this.token && this.graphQLClient);
  }
}
