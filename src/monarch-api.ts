import axios, { AxiosInstance } from 'axios';
import { GraphQLClient } from 'graphql-request';

export interface LoginResponse {
  token: string;
  user: any;
  errors?: string[];
}

export interface Account {
  id: string;
  mask: string | null;
  displayName: string;
  currentBalance: number;
  includeInNetWorth: boolean;
  type: {
    name: string;
    group: string;
    display: string;
  };
  subtype: {
    name: string;
    display: string;
  };
  institution?: {
    id: string;
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

interface Portfolio {
  performance: {
    totalValue: number;
    totalBasis: number;
    totalChangePercent: number;
    totalChangeDollars: number;
    oneDayChangePercent: number;
    historicalChart: {
      date: string;
      returnPercent: number;
    }[];
    benchmarks: {
      security: {
        id: string;
        ticker: string;
        name: string;
        oneDayChangePercent: number;
      };
      historicalChart: {
        date: string;
        returnPercent: number;
      }[];
    }[];
  };
  aggregateHoldings: {
    edges: {
      node: {
        id: string;
        quantity: number;
        basis: number;
        totalValue: number;
        securityPriceChangeDollars: number | null;
        securityPriceChangePercent: number | null;
        lastSyncedAt: string | null;
        holdings: {
          id: string;
          type: string;
          typeDisplay: string;
          name: string;
          ticker: string | null;
          closingPrice: number | null;
          closingPriceUpdatedAt: string | null;
          quantity: number;
          value: number;
          account: Account;
        }[];
        security: {
          id: string;
          name: string;
          ticker: string | null;
          currentPrice: number | null;
          currentPriceUpdatedAt: string | null;
          closingPrice: number | null;
          type: string;
          typeDisplay: string;
        };
      };
    }[];
  };
}

export class MonarchMoneyAPI {
  private static baseURL = 'https://api.monarch.com';
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

  async getPortfolio(startDate?: string, endDate?: string): Promise<Portfolio> {
    const query = `
      query GetPortfolio($portfolioInput: PortfolioInput) {
        portfolio(input: $portfolioInput) {
          performance {
            totalValue
            totalBasis
            totalChangePercent
            totalChangeDollars
            oneDayChangePercent
            historicalChart {
              date
              returnPercent
              __typename
            }
            benchmarks {
              security {
                id
                ticker
                name
                oneDayChangePercent
                __typename
              }
              historicalChart {
                date
                returnPercent
                __typename
              }
              __typename
            }
            __typename
          }
          aggregateHoldings {
            edges {
              node {
                id
                quantity
                basis
                totalValue
                securityPriceChangeDollars
                securityPriceChangePercent
                lastSyncedAt
                holdings {
                  id
                  type
                  typeDisplay
                  name
                  ticker
                  closingPrice
                  closingPriceUpdatedAt
                  quantity
                  value
                  account {
                    id
                    mask
                    icon
                    logoUrl
                    institution {
                      id
                      name
                      __typename
                    }
                    type {
                      name
                      display
                      __typename
                    }
                    subtype {
                      name
                      display
                      __typename
                    }
                    displayName
                    currentBalance
                    __typename
                  }
                  __typename
                }
                security {
                  id
                  name
                  ticker
                  currentPrice
                  currentPriceUpdatedAt
                  closingPrice
                  type
                  typeDisplay
                  __typename
                }
                __typename
              }
              __typename
            }
            __typename
          }
          __typename
        }
      }
    `;

    try {
      const data: any = await this.graphQLClient.request(query, {
        portfolioInput: { startDate, endDate },
      });
      return data.portfolio;
    } catch (error: any) {
      if (
        error.message.includes('401') ||
        error.message.includes('unauthorized')
      ) {
        throw new Error(
          'Authentication failed. Please check your MONARCH_TOKEN environment variable.'
        );
      }
      throw new Error(`Failed to get portfolio: ${error.message}`);
    }
  }
}
