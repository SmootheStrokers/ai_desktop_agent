/**
 * GitHub Plugin - JavaScript Version
 * Provides GitHub integration tools
 */

const githubPlugin = {
  name: 'github',
  version: '1.0.0',
  description: 'Interact with GitHub repositories and issues',
  author: 'LocalDev Team',

  async onLoad() {
    console.log('GitHub plugin loaded');
  },

  async onUnload() {
    console.log('GitHub plugin unloaded');
  },

  tools: [
    {
      name: 'search_repos',
      description: 'Search GitHub repositories',
      parameters: {
        type: 'object',
        properties: {
          query: { 
            type: 'string', 
            description: 'Search query (e.g., "react hooks", "language:typescript")' 
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return',
            default: 10
          }
        },
        required: ['query']
      },
      handler: async ({ query, limit = 10 }) => {
        try {
          // Mock repository search results
          const mockRepos = [];
          for (let i = 0; i < Math.min(limit, 5); i++) {
            mockRepos.push({
              name: `repo-${i + 1}`,
              full_name: `user/repo-${i + 1}`,
              description: `A sample repository for ${query}`,
              stars: Math.floor(Math.random() * 1000),
              forks: Math.floor(Math.random() * 100),
              language: ['TypeScript', 'JavaScript', 'Python', 'Go'][Math.floor(Math.random() * 4)],
              url: `https://github.com/user/repo-${i + 1}`,
              created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
            });
          }

          return {
            success: true,
            data: {
              query,
              total_count: mockRepos.length,
              repositories: mockRepos
            },
            message: `Found ${mockRepos.length} repositories for "${query}"`
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to search repositories'
          };
        }
      }
    },
    {
      name: 'create_issue',
      description: 'Create a GitHub issue',
      parameters: {
        type: 'object',
        properties: {
          repo: { 
            type: 'string', 
            description: 'Repository in format "owner/repo"' 
          },
          title: { 
            type: 'string', 
            description: 'Issue title' 
          },
          body: { 
            type: 'string', 
            description: 'Issue description' 
          },
          labels: {
            type: 'array',
            items: { type: 'string' },
            description: 'Labels to assign to the issue'
          }
        },
        required: ['repo', 'title']
      },
      handler: async ({ repo, title, body = '', labels = [] }) => {
        try {
          // Mock issue creation
          const mockIssue = {
            number: Math.floor(Math.random() * 1000) + 1,
            title,
            body,
            state: 'open',
            labels: labels.map(label => ({ name: label, color: '0075ca' })),
            url: `https://github.com/${repo}/issues/${Math.floor(Math.random() * 1000) + 1}`,
            created_at: new Date().toISOString(),
            user: {
              login: 'current-user',
              avatar_url: 'https://github.com/identicons/current-user.png'
            }
          };

          return {
            success: true,
            data: mockIssue,
            message: `Created issue #${mockIssue.number} in ${repo}`
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create issue'
          };
        }
      }
    },
    {
      name: 'list_prs',
      description: 'List pull requests for a repository',
      parameters: {
        type: 'object',
        properties: {
          repo: { 
            type: 'string', 
            description: 'Repository in format "owner/repo"' 
          },
          state: {
            type: 'string',
            enum: ['open', 'closed', 'all'],
            description: 'State of pull requests to list',
            default: 'open'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of PRs to return',
            default: 10
          }
        },
        required: ['repo']
      },
      handler: async ({ repo, state = 'open', limit = 10 }) => {
        try {
          // Mock pull request list
          const mockPRs = [];
          for (let i = 0; i < Math.min(limit, 5); i++) {
            mockPRs.push({
              number: i + 1,
              title: `Pull Request #${i + 1}`,
              body: `Description for PR #${i + 1}`,
              state: state === 'all' ? ['open', 'closed'][Math.floor(Math.random() * 2)] : state,
              url: `https://github.com/${repo}/pull/${i + 1}`,
              created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
              user: {
                login: `user-${i + 1}`,
                avatar_url: `https://github.com/identicons/user-${i + 1}.png`
              },
              head: {
                ref: `feature-${i + 1}`,
                sha: `abc123${i + 1}`
              },
              base: {
                ref: 'main',
                sha: 'def456'
              }
            });
          }

          return {
            success: true,
            data: {
              repository: repo,
              state,
              pull_requests: mockPRs
            },
            message: `Found ${mockPRs.length} ${state} pull requests in ${repo}`
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to list pull requests'
          };
        }
      }
    }
  ]
};

module.exports = githubPlugin;
