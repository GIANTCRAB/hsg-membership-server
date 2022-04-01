import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserTokenDto } from '../src/controllers/login/user-token-dto';
import { TestE2eHelpers } from './test-e2e-helpers';
import { CreateSpaceEventDto } from '../src/controllers/space-events/create-space-event-dto';
import moment from 'moment';
import { UserEntity } from '../src/entities/user.entity';
import { UserEmailVerificationEntity } from '../src/entities/user-email-verification.entity';

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
  const validUserData = {
    email: 'test@example.org',
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

  beforeAll(async () => {
    await e2eHelper.resetDatabase();
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
    const userData = {
      email: validUserData.email,
      password: validUserData.password,
    };
    const response = await e2eHelper.createValidLoginToken(userData);
    const userTokenResponse: UserTokenDto = response.body;
    loginToken = userTokenResponse.login_token.value;
    expect(userTokenResponse.login_token.is_valid).toEqual(true);
    expect(userTokenResponse.user.hashed_password).toBeUndefined();
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
    const userData = {
      email: validUserData.email,
      password: validUserData.password,
    };
    const response = await e2eHelper.createValidLoginToken(userData);
    const userTokenResponse: UserTokenDto = response.body;
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
});

describe('Space Event Flow (e2e)', () => {
  let loginToken: string = '';
  const validUserData = {
    email: 'test@example.org',
    first_name: 'test',
    last_name: 'surname',
    password: 'password123',
  };
  let validUser: UserEntity;
  const createdSpaceEvents = [];

  beforeAll(async () => {
    await e2eHelper.resetDatabase();
    validUser = await e2eHelper.createValidUser(validUserData);
    const userData = {
      email: validUserData.email,
      password: validUserData.password,
    };
    const response = await e2eHelper.createValidLoginToken(userData);
    const userTokenResponse: UserTokenDto = response.body;
    loginToken = userTokenResponse.login_token.value;
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
      .set('Authorization', loginToken);
    expect(response.status).toEqual(201);
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
      .set('Authorization', loginToken);
    expect(response.status).toEqual(201);
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
      .set('Authorization', loginToken);
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
      .set('Authorization', loginToken);
    expect(response.status).toEqual(422);
  });

  it('/space-events (POST) with conflict through event end date', async () => {
    const eventData: CreateSpaceEventDto = {
      title: 'test event',
      description: 'test stuff',
      event_start_date: moment().utc().add(10, 'days').toISOString(),
      event_end_date: moment().utc().add(40, 'days').toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/space-events')
      .send(eventData)
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);
    expect(response.status).toEqual(422);
  });

  it('/space-events (POST) with conflict and over-exceed through event end date', async () => {
    const eventData: CreateSpaceEventDto = {
      title: 'test event',
      description: 'test stuff',
      event_start_date: moment().utc().add(10, 'days').toISOString(),
      event_end_date: moment().utc().add(150, 'days').toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/space-events')
      .send(eventData)
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);
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
      .set('Authorization', loginToken);
    expect(response.status).toEqual(201);
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
    expect(response.body.organizer).toBeDefined();
    expect(response.body.photo).toBeNull();
  });

  it('/space-events/:id (GET) for ones with photo should have photo', async () => {
    const response = await request(app.getHttpServer())
      .get('/space-events/' + createdSpaceEvents[1].id)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(
      expect.objectContaining({ id: createdSpaceEvents[1].id }),
    );
    expect(response.body.organizer).toBeDefined();
    expect(response.body.photo).toBeDefined();
    const photoFileId = response.body.photo.id;
    const photoResponse = await request(app.getHttpServer()).get(
      '/photos/' + photoFileId + '/view',
    );
    expect(photoResponse.status).toEqual(200);
  });
});
