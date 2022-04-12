# Hackerspace Membership Server

This is the operating backend of a Hackerspace membership management server. It includes feature like user registration, user login and event management.

## Configuration

A sample configuration file named `.env.sample` is given in the main directory. It needs to be copied and renamed as `.env` for environment variables to work.

## Space Events

If the user isn't a member, they would require a proxy-host that is a member to host their events. Members who organize events will have their events automagically approved.

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
 - UserEntity

/admin/user-management/:id/remove-membership (POST) [AdminGuard]
 - UserEntity
```

### Login Endpoints

```
/user-auth/login (POST) email, password
 - Object 
    - user: UserEntity
    - login_token: LoginTokenEntity

/user-auth/logout (DELETE) [UserGuard]
```

### Registration Endpoints

```
/user-registration (POST) email, first_name, last_name, password
 - UserEntity
```

### User Email Verification Endpoints

```
/user-email-verifications/:id (POST) code
 - UserEmailVerificationEntity
```

### User Profile Endpoints

```
/user-profiles/self (GET) [UserGuard]
 - UserEntity

/user-profiles/update-details (POST) [UserGuard] first_name, last_name
 - UserEntity

/user-profiles/update-password (POST) [UserGuard] old_password, new_password
 - UserEntity

/user-profiles/:id/view (GET) [UserGuard]
 - UserEntity
```

### Space Events Endpoints

```
/space-events/latest (GET)
 - Array
    - SpaceEventEntity

/space-events/need-host (GET)
 - Array
    - SpaceEventEntity

/space-events/with-photo (POST) [UserGuard] photo, title, description, event_start_date, event_end_date
 - SpaceEventEntity

/space-events (POST) [UserGuard] photo, title, description, event_start_date, event_end_date
 - SpaceEventEntity

/space-events/:id (GET)
 - SpaceEventEntity

/space-events/:id (POST) [UserGuard] title, description, event_start_date, event_end_date
 - SpaceEventEntity

/space-events/:id/host-as-member (POST) [MemberGuard]
 - SpaceEventEntity
```
