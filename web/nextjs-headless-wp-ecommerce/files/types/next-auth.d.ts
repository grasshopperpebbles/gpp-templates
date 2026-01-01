import "next-auth"

declare module "next-auth" {
  interface Session {
    authToken: string
    refreshToken: string
    customerId: number
    user: {
      id: string
      email: string
      name: string
      image?: string
      firstName?: string
      lastName?: string
    }
  }

  interface User {
    authToken: string
    refreshToken: string
    firstName?: string
    lastName?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    authToken: string
    refreshToken: string
    customerId: number
    firstName?: string
    lastName?: string
  }
}