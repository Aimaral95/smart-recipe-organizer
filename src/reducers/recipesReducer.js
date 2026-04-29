// recipesReducer
// Pure function. Given current state + an action, returns the next state.
// Never mutates the input. Never has side effects (no API calls, no console
// logs in production code, no localStorage). That's what makes it testable
// and predictable — call it 100 times with the same args, get the same answer.
//
// The library is just an array of Recipe objects. Action types:
//
//   ADD              payload: Recipe                           append to array
//   DELETE           payload: string (id)                      remove by id
//   UPDATE_TAGS      payload: { id, tags: string[] }           replace tags
//   UPDATE_DIET      payload: { id, dietary: string[] }        replace dietary[]
//   UPDATE_TIME      payload: { id, cookTimeMinutes: number }  replace cook time
//   UPDATE_IMAGE     payload: { id, image: string }            replace image (Day 4)
//   TOGGLE_FAVORITE  payload: string (id)                      flip favorite bool
//   IMPORT           payload: Recipe[]                         merge by id (local wins on conflict)
//   REPLACE_ALL      payload: Recipe[]                         replace whole library (destructive)
//
// Recipe shape:
//   { id, title, ingredients, instructions, markdown,
//     tags, dietary, cookTimeMinutes, image, favorite, createdAt }

export const initialState = []

export function recipesReducer(state, action) {
    switch (action.type) {
        case "ADD":
            return [action.payload, ...state]   // newest first

        case "DELETE":
            return state.filter(r => r.id !== action.payload)

        case "UPDATE_TAGS":
            return state.map(r =>
                r.id === action.payload.id
                    ? { ...r, tags: action.payload.tags }
                    : r
            )

        case "UPDATE_DIET":
            return state.map(r =>
                r.id === action.payload.id
                    ? { ...r, dietary: action.payload.dietary }
                    : r
            )

        case "UPDATE_TIME":
            return state.map(r =>
                r.id === action.payload.id
                    ? { ...r, cookTimeMinutes: action.payload.cookTimeMinutes }
                    : r
            )

        case "UPDATE_IMAGE":
            return state.map(r =>
                r.id === action.payload.id
                    ? { ...r, image: action.payload.image }
                    : r
            )

        case "TOGGLE_FAVORITE":
            return state.map(r =>
                r.id === action.payload
                    ? { ...r, favorite: !r.favorite }
                    : r
            )

        case "IMPORT": {
            // Merge incoming recipes into the library, keyed by id.
            // Local recipes win on conflict, so importing your own export
            // back doesn't overwrite edits you made since.
            if (!Array.isArray(action.payload)) return state
            const localIds = new Set(state.map(r => r.id))
            const fresh = action.payload.filter(r => r && r.id && !localIds.has(r.id))
            return [...state, ...fresh]
        }

        case "REPLACE_ALL":
            return Array.isArray(action.payload) ? action.payload : state

        default:
            console.warn("recipesReducer: unknown action type", action.type)
            return state
    }
}
