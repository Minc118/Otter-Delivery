export function getMockAuthState() {
  return {
    isAuthenticated: false,
    provider: null,
    user: null,
  };
}

export function signInWithMockCredentials() {
  return {
    ok: true,
    nextPath: "/profile",
  };
}
