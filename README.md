# Hackerspace Membership Server

This is the operating backend of a Hackerspace membership management server. It includes feature like user registration, user login and event management.

## Configuration

A sample configuration file named `.env.sample` is given in the main directory. It needs to be copied and renamed as `.env` for environment variables to work.

## License

This software is licensed under AGPLv3. More details can be found in the [LICENSE file](LICENSE.md).

# API Documentation

## Guards

There are 3 guards in-place that checks the user's state. The 3 guards are [UserGuard], [MemberGuard] and [AdminGuard].

### User Guard

If user possesses a valid, not expired login token, they will pass the guard.

### Member Guard

If user possesses a valid, not expired login token, and the user has `is_member` set to true, they will pass the guard.

### Admin Guard

If user possesses a valid, not expired login token, and the user has `is_admin` set to true, they will pass the guard.

## Endpoints

### Admin Endpoints

```
/admin/is-admin (GET) [AdminGuard]
/admin/user-management/:id/add-membership (POST) [AdminGuard]
/admin/user-management/:id/remove-membership (POST) [AdminGuard]
```

### Login Endpoints

```
/user-auth/login (POST) email, password
/user-auth/logout (DELETE) [UserGuard]
```

### Registration Endpoints

```
/user-registration (POST) email, first_name, last_name, password
```
