# Hackerspace Membership Server

This is the operating backend of a Hackerspace membership management server. It includes feature like user registration,
user login and event management. 

Both the [server](https://github.com/GIANTCRAB/hsg-membership-server) and [client](https://github.com/GIANTCRAB/hsg-membership-client) is needed. They should sit in a folder structure like this:
```
- somefolder/
    - hsg-membership-client/
        - src/
        - dist/
        - ...
    - hsg-membership-server/
        - src/
        - ...
```

## Installation

```
npm install
```

## Configuration

A sample configuration file named `.env.sample` is given in the main directory. It needs to be copied and renamed
as `.env` for environment variables to work.

## Running

You should build the production client first.

```
npm run start
```

## Space Events

If the user isn't a member, they would require a proxy-host that is a member to host their events. Members who organize
events will have their events automagically approved.

## License

This software is licensed under AGPLv3. More details can be found in the [LICENSE file](LICENSE.md).

# API Documentation

API documentation is provided via Swagger UI. However, there are some things that must be noted in order to understand what is going on.

## Guards

There are 3 guards in-place that checks the user's state. The 3 guards are [UserGuard], [MemberGuard] and [AdminGuard].

### User Guard

If user possesses a valid, not expired login token, they will pass the guard.

### Member Guard

If user possesses a valid, not expired login token, and the user has `is_member` set to true, they will pass the guard.

### Admin Guard

If user possesses a valid, not expired login token, and the user has `is_admin` set to true, they will pass the guard.

## Endpoints

Make sure you have configured your application.

Run the following commands:

```
npm run start
```

Thereafter, go to `localhost:<APP_PORT>/api` to view the swagger interface.
