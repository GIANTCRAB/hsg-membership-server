import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserTokenDto } from '../src/controllers/login/user-token-dto';
import { TestE2eHelpers } from './test-e2e-helpers';
import { CreateSpaceEventDto } from '../src/controllers/space-events/create-space-event-dto';
import moment from 'moment';
import { UserEntity } from '../src/entities/user.entity';
import { UserEmailVerificationEntity } from '../src/entities/user-email-verification.entity';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';

const e2eHelper = new TestE2eHelpers();
let app: INestApplication;

beforeAll(async () => {
  app = await e2eHelper.startServer();
  return app;
});

afterAll(async () => {
  return await e2eHelper.stopServer();
});

describe('Authentication Flow (e2e)', () => {
  let loginToken: string = '';
  let adminLoginToken: string = '';
  const validUserData = {
    email: 'test@example.org',
    first_name: 'test',
    last_name: 'surname',
    password: 'password123',
  };
  const validAdminData = {
    email: 'test7@example.org',
    first_name: 'test',
    last_name: 'surname',
    password: 'password123',
  };
  const bannedUserData = {
    email: 'test5@example.org',
    first_name: 'test',
    last_name: 'surname',
    password: 'password123',
  };
  let adminUser: UserEntity;

  beforeAll(async () => {
    await e2eHelper.resetDatabase();
    adminUser = await e2eHelper.createValidAdmin(validAdminData);
    return app;
  });

  it('/user-registration (POST) with missing fields', () => {
    const userData = {
      email: 'test@example.org',
      first_name: 'test',
      last_name: 'surname',
    };
    return request(app.getHttpServer())
      .post('/user-registration')
      .send(userData)
      .set('Accept', 'application/json')
      .expect(400);
  });

  it('/user-registration (POST) with empty fields', () => {
    const userData = {
      email: 'test@example.org',
      first_name: 'test',
      last_name: 'surname',
      password: '',
    };
    return request(app.getHttpServer())
      .post('/user-registration')
      .send(userData)
      .set('Accept', 'application/json')
      .expect(400);
  });

  it('/user-registration (POST) with invalid email', () => {
    const userData = {
      email: 'test',
      first_name: 'test',
      last_name: 'surname',
      password: 'password123',
    };
    return request(app.getHttpServer())
      .post('/user-registration')
      .send(userData)
      .set('Accept', 'application/json')
      .expect(400);
  });

  it('/user-registration (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/user-registration')
      .send(validUserData)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(201);
  });

  it('/user-registration (POST) with existing email', async () => {
    const response = await request(app.getHttpServer())
      .post('/user-registration')
      .send(validUserData)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(422);
  });

  it('/user-email-verifications/:id (POST)', async () => {
    const verificationToken = await e2eHelper.getEmailVerificationToken(
      validUserData.email,
    );
    const verificationDto = {
      code: verificationToken.code,
    };
    const response = await request(app.getHttpServer())
      .post('/user-email-verifications/' + verificationToken.id)
      .send(verificationDto);
    const userEmailVerificationResponse: UserEmailVerificationEntity =
      response.body;
    expect(userEmailVerificationResponse.is_verified).toEqual(true);
    expect(userEmailVerificationResponse.user).toBeUndefined();
  });

  it('/user-auth/login (POST) with invalid email', async () => {
    const userData = {
      email: 'test',
      password: validUserData.password,
    };
    const response = await request(app.getHttpServer())
      .post('/user-auth/login')
      .send(userData)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(400);
  });

  it('/user-auth/login (POST) with incorrect password', async () => {
    const userData = {
      email: validUserData.email,
      password: 'password12',
    };
    const response = await request(app.getHttpServer())
      .post('/user-auth/login')
      .send(userData)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(422);
  });

  it('/user-auth/login (POST) with incorrect email', async () => {
    const userData = {
      email: 'test2@example.org',
      password: validUserData.password,
    };
    const response = await request(app.getHttpServer())
      .post('/user-auth/login')
      .send(userData)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(422);
  });

  it('/user-auth/login (POST) with banned account', async () => {
    await e2eHelper.createBannedUser(bannedUserData);
    const userData = {
      email: bannedUserData.email,
      password: validUserData.password,
    };
    const response = await request(app.getHttpServer())
      .post('/user-auth/login')
      .send(userData)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(422);
  });

  it('/user-auth/login (POST)', async () => {
    const loginData = {
      email: validUserData.email,
      password: validUserData.password,
    };
    const response = await request(app.getHttpServer())
      .post('/user-auth/login')
      .send(loginData)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(201);
    const userTokenResponse: UserTokenDto = response.body;
    loginToken = userTokenResponse.login_token.value;
    expect(userTokenResponse.login_token.is_valid).toEqual(true);
    expect(userTokenResponse.user.is_admin).toEqual(false);
    expect(userTokenResponse.user.hashed_password).toBeUndefined();
  });

  it('/user-auth/login (POST) as admin', async () => {
    const loginData = {
      email: validAdminData.email,
      password: validAdminData.password,
    };
    const response = await request(app.getHttpServer())
      .post('/user-auth/login')
      .send(loginData)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(201);
    const userTokenResponse: UserTokenDto = response.body;
    adminLoginToken = userTokenResponse.login_token.value;
    expect(userTokenResponse.login_token.is_valid).toEqual(true);
    expect(userTokenResponse.user.is_admin).toEqual(true);
    expect(userTokenResponse.user.hashed_password).toBeUndefined();
  });

  it('/admin/is-admin (GET) as normal user', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/is-admin')
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);
    expect(response.status).toEqual(403);
  });

  it('/admin/is-admin (GET) as admin user', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/is-admin')
      .set('Accept', 'application/json')
      .set('Authorization', adminLoginToken);
    expect(response.status).toEqual(200);
  });

  it('/user-auth/logout (DELETE)', async () => {
    const response = await request(app.getHttpServer())
      .delete('/user-auth/logout')
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);
    expect(response.status).toEqual(204);
  });

  it('/user-auth/logout (DELETE) with invalid token', async () => {
    const response = await request(app.getHttpServer())
      .delete('/user-auth/logout')
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);
    expect(response.status).toEqual(403);
  });

  it('/user-auth/login (POST) repeatedly causes throttle', async () => {
    const loginData = {
      email: validUserData.email,
      password: validUserData.password,
    };
    const threshold = 30;
    for (let i = 0; i < threshold; i++) {
      await request(app.getHttpServer())
        .post('/user-auth/login')
        .send(loginData)
        .set('Accept', 'application/json');
    }
    const response = await request(app.getHttpServer())
      .post('/user-auth/login')
      .set('Accept', 'application/json');
    expect(response.status).toEqual(429);
  });
});

describe('User Profile Flow (e2e)', () => {
  let loginToken: string = '';
  const validUserData = {
    email: 'test@example.org',
    first_name: 'test',
    last_name: 'surname',
    password: 'password123',
  };
  let validUser: UserEntity;

  beforeAll(async () => {
    await e2eHelper.resetDatabase();
    validUser = await e2eHelper.createValidUser(validUserData);
    const userTokenResponse: UserTokenDto =
      await e2eHelper.createValidLoginToken(validUser);
    loginToken = userTokenResponse.login_token.value;
    return app;
  });

  it('/user-profiles/self (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/user-profiles/self')
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);

    expect(response.status).toEqual(200);
    expect(response.body.id).toEqual(validUser.id);
  });

  it('/user-profiles/update-details (POST) partial update', async () => {
    const userDetails = {
      first_name: randomStringGenerator(),
    };
    const response = await request(app.getHttpServer())
      .post('/user-profiles/update-details')
      .send(userDetails)
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);

    expect(response.status).toEqual(200);
    expect(response.body.id).toEqual(validUser.id);
    expect(response.body.first_name).toEqual(userDetails.first_name);
    expect(response.body.last_name).toEqual(validUserData.last_name);
    expect(response.body.hashed_password).toBeUndefined();
  });

  it('/user-profiles/update-details (POST)', async () => {
    const userDetails = {
      first_name: randomStringGenerator(),
      last_name: randomStringGenerator(),
    };
    const response = await request(app.getHttpServer())
      .post('/user-profiles/update-details')
      .send(userDetails)
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);

    expect(response.status).toEqual(200);
    expect(response.body.id).toEqual(validUser.id);
    expect(response.body.first_name).toEqual(userDetails.first_name);
    expect(response.body.last_name).toEqual(userDetails.last_name);
    expect(response.body.hashed_password).toBeUndefined();
  });

  it('/user-profiles/update-password (POST) with incorrect password', async () => {
    const userDetails = {
      old_password: randomStringGenerator(),
      new_password: randomStringGenerator(),
    };
    const response = await request(app.getHttpServer())
      .post('/user-profiles/update-password')
      .send(userDetails)
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);

    expect(response.status).toEqual(422);
  });

  it('/user-profiles/update-password (POST)', async () => {
    const userDetails = {
      old_password: validUserData.password,
      new_password: randomStringGenerator(),
    };
    const response = await request(app.getHttpServer())
      .post('/user-profiles/update-password')
      .send(userDetails)
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);

    expect(response.status).toEqual(200);
    expect(response.body.id).toEqual(validUser.id);
    expect(response.body.hashed_password).toBeUndefined();

    // Changing password would invalidate all login tokens
    const responseAfterUpdate = await request(app.getHttpServer())
      .post('/user-profiles/update-password')
      .send(userDetails)
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);
    expect(responseAfterUpdate.status).toEqual(403);
  });
});

describe('Space Event Flow (e2e)', () => {
  let userLoginToken: string = '';
  let memberLoginToken: string = '';
  let spaceEventIdRequiringApproval: string = '';
  const validUserData = {
    email: 'test@example.org',
    first_name: 'test',
    last_name: 'surname',
    password: 'password123',
  };
  const validMemberData = {
    email: 'test2@example.org',
    first_name: 'test',
    last_name: 'surname',
    password: 'password123',
  };
  let validMember: UserEntity;
  let validUser: UserEntity;
  const createdSpaceEvents = [];

  beforeAll(async () => {
    await e2eHelper.resetDatabase();
    validUser = await e2eHelper.createValidUser(validUserData);
    const userTokenResponse: UserTokenDto =
      await e2eHelper.createValidLoginToken(validUser);
    userLoginToken = userTokenResponse.login_token.value;

    validMember = await e2eHelper.createValidMember(validMemberData);
    const memberTokenResponse: UserTokenDto =
      await e2eHelper.createValidLoginToken(validMember);
    memberLoginToken = memberTokenResponse.login_token.value;
    return app;
  });

  it('/space-events (POST)', async () => {
    const eventData: CreateSpaceEventDto = {
      title: 'test event',
      description: 'test stuff',
      event_start_date: moment().utc().add(30, 'days').toISOString(),
      event_end_date: moment().utc().add(90, 'days').toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/space-events')
      .send(eventData)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken);
    expect(response.status).toEqual(201);
    expect(response.body.is_approved).toEqual(true);
    createdSpaceEvents.push(response.body);
  });

  it('/space-events (POST) as non-member', async () => {
    const eventData: CreateSpaceEventDto = {
      title: 'test event',
      description: 'test stuff',
      event_start_date: moment().utc().add(1, 'days').toISOString(),
      event_end_date: moment()
        .utc()
        .add(1, 'days')
        .add(1, 'hours')
        .toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/space-events')
      .set('Accept', 'application/json')
      .set('Authorization', userLoginToken)
      .send(eventData);
    expect(response.status).toEqual(201);
    expect(response.body.is_approved).toEqual(false);
    expect(response.body.organizer).toBeDefined();
    expect(response.body.host).toBeUndefined();
    spaceEventIdRequiringApproval = response.body.id;
  });

  it('/space-events/need-host (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/space-events/need-host')
      .set('Accept', 'application/json');
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: spaceEventIdRequiringApproval,
          is_valid: true,
          is_approved: false,
        }),
      ]),
    );
  });

  it('/space-events/:id/host-as-member (POST) as non-member', async () => {
    const response = await request(app.getHttpServer())
      .post(
        '/space-events/' + spaceEventIdRequiringApproval + '/host-as-member',
      )
      .set('Accept', 'application/json')
      .set('Authorization', userLoginToken)
      .send();
    expect(response.status).toEqual(403);
  });

  it('/space-events/:id/host-as-member (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post(
        '/space-events/' + spaceEventIdRequiringApproval + '/host-as-member',
      )
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body.is_approved).toEqual(true);
    expect(response.body.organizer).toBeDefined();
    expect(response.body.host).toBeDefined();
    createdSpaceEvents.push(response.body);
  });

  it('/space-events/with-photo (POST)', async () => {
    const eventData = {
      title: 'test event',
      description: 'test stuff',
      event_start_date: moment().utc().add(10, 'days').toISOString(),
      event_end_date: moment().utc().add(11, 'days').toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/space-events/with-photo')
      .attach('photo', './test/files/event-test.png')
      .field(eventData)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken);
    expect(response.status).toEqual(201);
    expect(response.body.is_approved).toEqual(true);
    createdSpaceEvents.push(response.body);
  });

  it('/space-events (POST) with conflict event start and end date', async () => {
    const eventData: CreateSpaceEventDto = {
      title: 'test event',
      description: 'test stuff',
      event_start_date: moment().utc().add(40, 'days').toISOString(),
      event_end_date: moment().utc().add(60, 'days').toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/space-events')
      .send(eventData)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken);
    expect(response.status).toEqual(422);
  });

  it('/space-events (POST) with conflict through event start date', async () => {
    const eventData: CreateSpaceEventDto = {
      title: 'test event',
      description: 'test stuff',
      event_start_date: moment().utc().add(60, 'days').toISOString(),
      event_end_date: moment().utc().add(150, 'days').toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/space-events')
      .send(eventData)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken);
    expect(response.status).toEqual(422);
  });

  it('/space-events (POST) with conflict through event end date', async () => {
    const eventData: CreateSpaceEventDto = {
      title: 'test event',
      description: 'test stuff',
      event_start_date: moment().utc().add(20, 'days').toISOString(),
      event_end_date: moment().utc().add(40, 'days').toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/space-events')
      .send(eventData)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken);
    expect(response.status).toEqual(422);
  });

  it('/space-events (POST) with conflict and over-exceed through event end date', async () => {
    const eventData: CreateSpaceEventDto = {
      title: 'test event',
      description: 'test stuff',
      event_start_date: moment().utc().add(20, 'days').toISOString(),
      event_end_date: moment().utc().add(150, 'days').toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/space-events')
      .send(eventData)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken);
    expect(response.status).toEqual(422);
  });

  it('/space-events (POST) without conflict event start and end date', async () => {
    const eventData: CreateSpaceEventDto = {
      title: 'test event',
      description: 'test stuff',
      event_start_date: moment().utc().add(140, 'days').toISOString(),
      event_end_date: moment().utc().add(150, 'days').toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/space-events')
      .send(eventData)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken);
    expect(response.status).toEqual(201);
    expect(response.body.is_approved).toEqual(true);
    createdSpaceEvents.push(response.body);
  });

  it('/space-events/latest (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/space-events/latest')
      .set('Accept', 'application/json');
    expect(response.status).toEqual(200);
    expect(response.body).toHaveLength(createdSpaceEvents.length);
    createdSpaceEvents.forEach((createdSpaceEvent) => {
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: createdSpaceEvent.id }),
        ]),
      );
    });
  });

  it('/space-events/:id (GET) with invalid ID', async () => {
    const response = await request(app.getHttpServer())
      .get('/space-events/abcde-fac')
      .set('Accept', 'application/json');
    expect(response.status).toEqual(404);
  });

  it('/space-events/:id (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/space-events/' + createdSpaceEvents[0].id)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(
      expect.objectContaining({ id: createdSpaceEvents[0].id }),
    );
    expect(response.body.is_approved).toEqual(true);
    expect(response.body.organizer).toBeDefined();
    expect(response.body.host).toBeDefined();
    expect(response.body.photo).toBeNull();
  });

  it('/space-events/:id (POST)', async () => {
    const newSpaceEventDetails = {
      title: randomStringGenerator(),
    };
    const response = await request(app.getHttpServer())
      .post('/space-events/' + createdSpaceEvents[0].id)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken)
      .send(newSpaceEventDetails);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(
      expect.objectContaining({ id: createdSpaceEvents[0].id }),
    );
    expect(response.body.is_approved).toEqual(true);
    expect(response.body.title).toEqual(newSpaceEventDetails.title);
    expect(response.body.organizer).toBeDefined();
    expect(response.body.host).toBeDefined();
    expect(response.body.photo).toBeNull();
  });

  it('/space-events/:id (POST) as not organizer', async () => {
    const newSpaceEventDetails = {
      title: randomStringGenerator(),
    };
    const response = await request(app.getHttpServer())
      .post('/space-events/' + createdSpaceEvents[1].id)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken)
      .send(newSpaceEventDetails);
    expect(response.status).toEqual(403);
  });

  it('/space-events/:id (POST) update with time', async () => {
    const newSpaceEventDetails = {
      title: randomStringGenerator(),
      event_start_date: moment()
        .utc()
        .add(31, 'days')
        .startOf('minute')
        .toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/space-events/' + createdSpaceEvents[0].id)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken)
      .send(newSpaceEventDetails);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(
      expect.objectContaining({ id: createdSpaceEvents[0].id }),
    );
    expect(response.body.title).toEqual(newSpaceEventDetails.title);
    expect(response.body.is_approved).toEqual(true);
    expect(response.body.event_start_date).toEqual(
      newSpaceEventDetails.event_start_date,
    );
    expect(response.body.organizer).toBeDefined();
    expect(response.body.host).toBeDefined();
    expect(response.body.photo).toBeNull();
  });

  it('/space-events/:id (POST) update with conflict event_start_date', async () => {
    const newSpaceEventDetails = {
      title: randomStringGenerator(),
      event_start_date: moment()
        .utc()
        .add(10, 'days')
        .startOf('minute')
        .toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/space-events/' + createdSpaceEvents[0].id)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken)
      .send(newSpaceEventDetails);
    expect(response.status).toEqual(422);
  });

  it('/space-events/:id (GET) for ones with photo should have photo', async () => {
    const response = await request(app.getHttpServer())
      .get('/space-events/' + createdSpaceEvents[2].id)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(
      expect.objectContaining({ id: createdSpaceEvents[2].id }),
    );
    expect(response.body.is_approved).toEqual(true);
    expect(response.body.host).toBeDefined();
    expect(response.body.organizer).toBeDefined();
    expect(response.body.photo).toBeDefined();
    const photoFileId = response.body.photo.id;
    const photoResponse = await request(app.getHttpServer()).get(
      '/photos/' + photoFileId + '/view',
    );
    expect(photoResponse.status).toEqual(200);
  });
});

describe('Admin User Management Flow (e2e)', () => {
  let adminLoginToken: string = '';
  const validUserData = {
    email: 'test@example.org',
    first_name: 'test',
    last_name: 'surname',
    password: 'password123',
  };
  const validAdminData = {
    email: 'test7@example.org',
    first_name: 'test',
    last_name: 'surname',
    password: 'password123',
  };
  let validUser: UserEntity;
  let adminUser: UserEntity;

  beforeAll(async () => {
    await e2eHelper.resetDatabase();
    validUser = await e2eHelper.createValidUser(validUserData);
    adminUser = await e2eHelper.createValidAdmin(validAdminData);
    const adminTokenResponse: UserTokenDto =
      await e2eHelper.createValidLoginToken(adminUser);
    adminLoginToken = adminTokenResponse.login_token.value;
    return app;
  });

  it('/admin/user-management/:id/add-membership (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/admin/user-management/' + validUser.id + '/add-membership')
      .set('Accept', 'application/json')
      .set('Authorization', adminLoginToken)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body.id).toEqual(validUser.id);
    expect(response.body.is_member).toEqual(true);
  });

  it('/admin/user-management/:id/remove-membership (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/admin/user-management/' + validUser.id + '/remove-membership')
      .set('Accept', 'application/json')
      .set('Authorization', adminLoginToken)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body.id).toEqual(validUser.id);
    expect(response.body.is_member).toEqual(false);
  });
});
