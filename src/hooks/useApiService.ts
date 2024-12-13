import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

interface UseApiServiceOptions extends RequestInit {
  triggerOnLoad?: boolean;
}

interface UseApiServiceState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

interface Action<T> {
  type: "REQUEST" | "SUCCESS" | "FAILURE";
  payload?: T;
  error?: string;
}

const initialState = {
  data: null,
  error: null,
  loading: false,
};

function apiServiceReducer<T>(
  state: UseApiServiceState<T>,
  action: Action<T>
): UseApiServiceState<T> {
  switch (action.type) {
    case "REQUEST":
      return { ...state, loading: true, error: null };
    case "SUCCESS":
      return { ...state, data: action.payload || null, loading: false };
    case "FAILURE":
      return {
        ...state,
        error: action.error || "Something went wrong!",
        loading: false,
      };
    default:
      return state;
  }
}

const useApiService = <T>(
  url: RequestInfo | URL,
  { triggerOnLoad = true, ...options }: UseApiServiceOptions = {}
) => {
  const [state, dispatch] = useReducer(apiServiceReducer<T>, initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialRender = useRef(true); // Track the initial render

  // Memoize the 'options' object to avoid unnecessary re-renders when the 'options' reference changes.
  // JSON.stringify(options) is used to deep compare the 'options' object, ensuring that the effect
  // only re-runs when the content of the 'options' object changes (not just its reference).
  const optionsMemoized = useMemo(() => options, [JSON.stringify(options)]);

  const trigger = useCallback(async () => {
    // Prevent premature cancellation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    dispatch({ type: "REQUEST" });

    try {
      const response = await fetch(url, {
        ...optionsMemoized,
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(response.statusText || "Something went wrong!");
      }

      const responseData: T = await response.json();
      dispatch({ type: "SUCCESS", payload: responseData });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        console.log("Request aborted");
        return;
      }

      dispatch({
        type: "FAILURE",
        error: err instanceof Error ? err.message : "Something went wrong!",
      });
    }
  }, [url, optionsMemoized]);

  useEffect(() => {
    if (triggerOnLoad && isInitialRender.current) {
      isInitialRender.current = false; // Ensure it runs only once
      trigger(); // Trigger the API call during the first render
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort(); // Abort on unmount
      }
    };
  }, [trigger, triggerOnLoad]);

  return { ...state, trigger };
};

export default useApiService;
