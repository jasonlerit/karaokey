import { defaultShouldDehydrateQuery, environmentManager, QueryClient } from '@tanstack/react-query'
import SuperJSON from 'superjson'

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  })

let clientQueryClientSingleton: QueryClient | undefined

export const getQueryClient = () => {
  if (environmentManager.isServer()) {
    return createQueryClient()
  }

  return (clientQueryClientSingleton ??= createQueryClient())
}
