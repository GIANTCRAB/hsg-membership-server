import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserTokenDto } from '../src/controllers/login/user-token-dto';
import { TestE2eHelpers } from './test-e2e-helpers';
import { CreateSpaceEventDto } from '../src/controllers/space-events/create-space-event-dto';
import moment from 'moment';
import { UserEntity } from '../src/entities/user.entity';
import { UserEmailVerificationEntity } from '../src/entities/user-email-verification.entity';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { CreateInventoryItemDto } from '../src/controllers/inventory-items/create-inventory-item-dto';
import { randomInt } from 'crypto';
import { CreateInventoryCategoryDto } from '../src/controllers/inventory-categories/create-inventory-category-dto';
import { UpdateInventoryItemDto } from '../src/controllers/inventory-items/update-inventory-item-dto';
import { UpdateInventoryCategoryDto } from '../src/controllers/inventory-categories/update-inventory-category-dto';
import { PasswordResetResponseDto } from '../src/controllers/password-resets/password-reset-response-dto';
import { PasswordResetConfirmationDto } from '../src/controllers/password-resets/password-reset-confirmation-dto';

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

  it('/api/user-registration (POST) with missing fields', () => {
    const userData = {
      email: 'test@example.org',
      first_name: 'test',
      last_name: 'surname',
    };
    return request(app.getHttpServer())
      .post('/api/user-registration')
      .send(userData)
      .set('Accept', 'application/json')
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('/api/user-registration (POST) with empty fields', () => {
    const userData = {
      email: 'test@example.org',
      first_name: 'test',
      last_name: 'surname',
      password: '',
    };
    return request(app.getHttpServer())
      .post('/api/user-registration')
      .send(userData)
      .set('Accept', 'application/json')
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('/api/user-registration (POST) with invalid email', () => {
    const userData = {
      email: 'test',
      first_name: 'test',
      last_name: 'surname',
      password: 'password123',
    };
    return request(app.getHttpServer())
      .post('/api/user-registration')
      .send(userData)
      .set('Accept', 'application/json')
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('/api/user-registration (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/user-registration')
      .send(validUserData)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.CREATED);
    expect(response.body.hashed_password).toBeUndefined();
  });

  it('/api/user-registration (POST) with existing email', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/user-registration')
      .send(validUserData)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('/api/user-email-verifications/:id (POST)', async () => {
    const verificationToken = await e2eHelper.getEmailVerificationToken(
      validUserData.email,
    );
    const verificationDto = {
      code: verificationToken.code,
    };
    const response = await request(app.getHttpServer())
      .post('/api/user-email-verifications/' + verificationToken.id)
      .send(verificationDto);
    const userEmailVerificationResponse: UserEmailVerificationEntity =
      response.body;
    expect(userEmailVerificationResponse.is_verified).toEqual(true);
    expect(userEmailVerificationResponse.user).toBeUndefined();
  });

  it('/api/user-auth/login (POST) with invalid email', async () => {
    const userData = {
      email: 'test',
      password: validUserData.password,
    };
    const response = await request(app.getHttpServer())
      .post('/api/user-auth/login')
      .send(userData)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
  });

  it('/api/user-auth/login (POST) with incorrect password', async () => {
    const userData = {
      email: validUserData.email,
      password: 'password12',
    };
    const response = await request(app.getHttpServer())
      .post('/api/user-auth/login')
      .send(userData)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('/api/user-auth/login (POST) with incorrect email', async () => {
    const userData = {
      email: 'test2@example.org',
      password: validUserData.password,
    };
    const response = await request(app.getHttpServer())
      .post('/api/user-auth/login')
      .send(userData)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('/api/user-auth/login (POST) with banned account', async () => {
    await e2eHelper.createBannedUser(bannedUserData);
    const userData = {
      email: bannedUserData.email,
      password: validUserData.password,
    };
    const response = await request(app.getHttpServer())
      .post('/api/user-auth/login')
      .send(userData)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('/api/user-auth/login (POST)', async () => {
    const loginData = {
      email: validUserData.email,
      password: validUserData.password,
    };
    const response = await request(app.getHttpServer())
      .post('/api/user-auth/login')
      .send(loginData)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.CREATED);
    const userTokenResponse: UserTokenDto = response.body;
    loginToken = 'Bearer ' + userTokenResponse.login_token.value;
    expect(userTokenResponse.login_token.is_valid).toEqual(true);
    expect(userTokenResponse.user.email).toEqual(validUserData.email);
    expect(userTokenResponse.user.is_admin).toEqual(false);
    expect(userTokenResponse.user.hashed_password).toBeUndefined();
  });

  it('/api/user-auth/login (POST) as admin', async () => {
    const loginData = {
      email: validAdminData.email,
      password: validAdminData.password,
    };
    const response = await request(app.getHttpServer())
      .post('/api/user-auth/login')
      .send(loginData)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.CREATED);
    const userTokenResponse: UserTokenDto = response.body;
    adminLoginToken = 'Bearer ' + userTokenResponse.login_token.value;
    expect(userTokenResponse.login_token.is_valid).toEqual(true);
    expect(userTokenResponse.user.email).toEqual(validAdminData.email);
    expect(userTokenResponse.user.is_admin).toEqual(true);
    expect(userTokenResponse.user.hashed_password).toBeUndefined();
  });

  it('/api/admin/is-admin (GET) as normal user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/is-admin')
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);
    expect(response.status).toEqual(HttpStatus.FORBIDDEN);
  });

  it('/api/admin/is-admin (GET) as admin user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/is-admin')
      .set('Accept', 'application/json')
      .set('Authorization', adminLoginToken);
    expect(response.status).toEqual(HttpStatus.OK);
  });

  it('/api/user-auth/logout (DELETE)', async () => {
    const response = await request(app.getHttpServer())
      .delete('/api/user-auth/logout')
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);
    expect(response.status).toEqual(HttpStatus.NO_CONTENT);
  });

  it('/api/user-auth/logout (DELETE) with invalid token', async () => {
    const response = await request(app.getHttpServer())
      .delete('/api/user-auth/logout')
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);
    expect(response.status).toEqual(HttpStatus.FORBIDDEN);
  });

  it('/api/user-auth/login (POST) repeatedly causes throttle', async () => {
    const loginData = {
      email: validUserData.email,
      password: validUserData.password,
    };
    const threshold = 30;
    for (let i = 0; i < threshold; i++) {
      await request(app.getHttpServer())
        .post('/api/user-auth/login')
        .send(loginData)
        .set('Accept', 'application/json');
    }
    const response = await request(app.getHttpServer())
      .post('/api/user-auth/login')
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.TOO_MANY_REQUESTS);
  });
});

describe('Password Reset Flow (e2e)', () => {
  const validUserData = {
    email: 'test@example.org',
    first_name: 'test',
    last_name: 'surname',
    password: 'password123',
  };
  const invalidUserData = {
    email: randomStringGenerator() + '@example.org',
    first_name: 'test',
    last_name: 'surname',
    password: 'password123',
  };
  let passwordResetResponseDto: PasswordResetResponseDto;
  let invalidPasswordResetResponseDto: PasswordResetResponseDto;

  let validUser: UserEntity;

  beforeAll(async () => {
    await e2eHelper.resetDatabase();
    e2eHelper.resetMiddlewares();
    validUser = await e2eHelper.createValidUser(validUserData);
    return app;
  });

  it('/api/password-resets (POST) with invalid email', async () => {
    const userDetails = {
      email: invalidUserData.email,
    };
    const response = await request(app.getHttpServer())
      .post('/api/password-resets')
      .send(userDetails)
      .set('Accept', 'application/json');

    expect(response.status).toEqual(HttpStatus.CREATED);
    expect(response.body.id).toBeDefined();
    invalidPasswordResetResponseDto = response.body;
  });

  it('/api/password-resets (POST) with valid email', async () => {
    const userDetails = {
      email: validUserData.email,
    };
    const response = await request(app.getHttpServer())
      .post('/api/password-resets')
      .send(userDetails)
      .set('Accept', 'application/json');

    expect(response.status).toEqual(HttpStatus.CREATED);
    expect(response.body.id).toBeDefined();
    passwordResetResponseDto = response.body;
  });

  it('/api/password-resets/:id (POST) with invalid ID', async () => {
    const passwordResetEntity = await e2eHelper.getPasswordResetEntity(
      passwordResetResponseDto.id,
    );
    const passwordResetConfirmation: PasswordResetConfirmationDto = {
      email: passwordResetEntity.email,
      code: passwordResetEntity.code,
      new_password: randomStringGenerator(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/password-resets/' + randomStringGenerator())
      .send(passwordResetConfirmation)
      .set('Accept', 'application/json');

    expect(response.status).toEqual(HttpStatus.NOT_FOUND);
  });

  it('/api/password-resets/:id (POST)', async () => {
    const passwordResetEntity = await e2eHelper.getPasswordResetEntity(
      passwordResetResponseDto.id,
    );
    const passwordResetConfirmation: PasswordResetConfirmationDto = {
      email: passwordResetEntity.email,
      code: passwordResetEntity.code,
      new_password: randomStringGenerator(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/password-resets/' + passwordResetEntity.id)
      .send(passwordResetConfirmation)
      .set('Accept', 'application/json');

    expect(response.status).toEqual(HttpStatus.OK);
  });

  it('/api/password-resets/:id (POST) with invalid record', async () => {
    const passwordResetConfirmation: PasswordResetConfirmationDto = {
      email: invalidPasswordResetResponseDto.email,
      code: randomStringGenerator(),
      new_password: randomStringGenerator(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/password-resets/' + invalidPasswordResetResponseDto.id)
      .send(passwordResetConfirmation)
      .set('Accept', 'application/json');

    expect(response.status).toEqual(HttpStatus.NOT_FOUND);
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
    loginToken = 'Bearer ' + userTokenResponse.login_token.value;
    return app;
  });

  it('/api/user-profiles (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/user-profiles')
      .set('Accept', 'application/json');

    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body.data).toBeDefined();
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: validUser.id,
        }),
      ]),
    );
    expect(response.body.current_page).toEqual(1);
    expect(response.body.last_page).toEqual(1);
    expect(response.body.total_count).toEqual(1);
  });

  it('/api/user-profiles/self (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/user-profiles/self')
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);

    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body.id).toEqual(validUser.id);
    expect(response.body.email).toEqual(validUserData.email);
    expect(response.body.hashed_password).toBeUndefined();
  });

  it('/api/user-profiles/:id/view (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/user-profiles/' + validUser.id + '/view')
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);

    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body.id).toEqual(validUser.id);
    expect(response.body.email).toBeUndefined();
    expect(response.body.hashed_password).toBeUndefined();
  });

  it('/api/user-profiles/:id (GET) with invalid user id', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/user-profiles/abcd/view')
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);

    expect(response.status).toEqual(HttpStatus.NOT_FOUND);
  });

  it('/api/user-profiles/update-details (POST) partial update', async () => {
    const userDetails = {
      first_name: randomStringGenerator(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/user-profiles/update-details')
      .send(userDetails)
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);

    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body.id).toEqual(validUser.id);
    expect(response.body.first_name).toEqual(userDetails.first_name);
    expect(response.body.last_name).toEqual(validUserData.last_name);
    expect(response.body.email).toEqual(validUserData.email);
    expect(response.body.hashed_password).toBeUndefined();
  });

  it('/api/user-profiles/update-details (POST) partial update with non-DTO details', async () => {
    const userDetails = {
      email: randomStringGenerator(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/user-profiles/update-details')
      .send(userDetails)
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);

    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body.id).toEqual(validUser.id);
    expect(response.body.first_name).toBeDefined();
    expect(response.body.last_name).toEqual(validUserData.last_name);
    expect(response.body.email).toEqual(validUserData.email);
    expect(response.body.hashed_password).toBeUndefined();
  });

  it('/api/user-profiles/update-details (POST) public update', async () => {
    const userDetails = {
      is_public: false,
    };
    const response = await request(app.getHttpServer())
      .post('/api/user-profiles/update-details')
      .send(userDetails)
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);

    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body.id).toEqual(validUser.id);
    expect(response.body.is_public).toEqual(userDetails.is_public);
    expect(response.body.first_name).toBeDefined();
    expect(response.body.last_name).toEqual(validUserData.last_name);
    expect(response.body.email).toEqual(validUserData.email);
    expect(response.body.hashed_password).toBeUndefined();

    const profileResponse = await request(app.getHttpServer())
      .get('/api/user-profiles/' + validUser.id + '/view')
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);

    expect(profileResponse.status).toEqual(HttpStatus.NOT_FOUND);
  });

  it('/api/user-profiles/update-details (POST)', async () => {
    const userDetails = {
      first_name: randomStringGenerator(),
      last_name: randomStringGenerator(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/user-profiles/update-details')
      .send(userDetails)
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);

    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body.id).toEqual(validUser.id);
    expect(response.body.first_name).toEqual(userDetails.first_name);
    expect(response.body.last_name).toEqual(userDetails.last_name);
    expect(response.body.email).toEqual(validUserData.email);
    expect(response.body.hashed_password).toBeUndefined();
  });

  it('/api/user-profiles/update-password (POST) with incorrect password', async () => {
    const userDetails = {
      old_password: randomStringGenerator(),
      new_password: randomStringGenerator(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/user-profiles/update-password')
      .send(userDetails)
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);

    expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('/api/user-profiles/update-password (POST)', async () => {
    const userDetails = {
      old_password: validUserData.password,
      new_password: randomStringGenerator(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/user-profiles/update-password')
      .send(userDetails)
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);

    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body.id).toEqual(validUser.id);
    expect(response.body.email).toEqual(validUserData.email);
    expect(response.body.hashed_password).toBeUndefined();

    // Changing password would invalidate all login tokens
    const responseAfterUpdate = await request(app.getHttpServer())
      .post('/api/user-profiles/update-password')
      .send(userDetails)
      .set('Accept', 'application/json')
      .set('Authorization', loginToken);
    expect(responseAfterUpdate.status).toEqual(HttpStatus.FORBIDDEN);
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
    userLoginToken = 'Bearer ' + userTokenResponse.login_token.value;

    validMember = await e2eHelper.createValidMember(validMemberData);
    const memberTokenResponse: UserTokenDto =
      await e2eHelper.createValidLoginToken(validMember);
    memberLoginToken = 'Bearer ' + memberTokenResponse.login_token.value;
    return app;
  });

  it('/api/space-events (POST)', async () => {
    const eventData: CreateSpaceEventDto = {
      title: 'test event',
      description: 'test stuff',
      event_start_date: moment().utc().add(30, 'days').toISOString(),
      event_end_date: moment().utc().add(90, 'days').toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/space-events')
      .send(eventData)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken);
    expect(response.status).toEqual(HttpStatus.CREATED);
    expect(response.body.is_approved).toEqual(true);
    expect(response.body.organizer).toBeDefined();
    expect(response.body.organizer.id).toEqual(validMember.id);
    expect(response.body.organizer.email).toBeUndefined();
    expect(response.body.host).toBeDefined();
    expect(response.body.host.id).toEqual(validMember.id);
    expect(response.body.host.email).toBeUndefined();
    createdSpaceEvents.push(response.body);
  });

  it('/api/space-events (POST) as non-member', async () => {
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
      .post('/api/space-events')
      .set('Accept', 'application/json')
      .set('Authorization', userLoginToken)
      .send(eventData);
    expect(response.status).toEqual(HttpStatus.CREATED);
    expect(response.body.is_approved).toEqual(false);
    expect(response.body.organizer).toBeDefined();
    expect(response.body.host).toBeUndefined();
    spaceEventIdRequiringApproval = response.body.id;
  });

  it('/api/space-events/need-host (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/space-events/need-host')
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body.data).toBeDefined();
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: spaceEventIdRequiringApproval,
          is_valid: true,
          is_approved: false,
        }),
      ]),
    );
    expect(response.body.current_page).toEqual(1);
    expect(response.body.last_page).toEqual(1);
    expect(response.body.total_count).toEqual(1);
  });

  it('/api/space-events/:id/host-as-member (POST) as non-member', async () => {
    const response = await request(app.getHttpServer())
      .post(
        '/api/space-events/' +
          spaceEventIdRequiringApproval +
          '/host-as-member',
      )
      .set('Accept', 'application/json')
      .set('Authorization', userLoginToken);
    expect(response.status).toEqual(HttpStatus.FORBIDDEN);
  });

  it('/api/space-events/:id/host-as-member (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post(
        '/api/space-events/' +
          spaceEventIdRequiringApproval +
          '/host-as-member',
      )
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken);
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body.is_approved).toEqual(true);
    expect(response.body.organizer).toBeDefined();
    expect(response.body.host).toBeDefined();
    createdSpaceEvents.push(response.body);
  });

  it('/api/space-events/with-photo (POST)', async () => {
    const eventData = {
      title: 'test event',
      description: 'test stuff',
      event_start_date: moment().utc().add(10, 'days').toISOString(),
      event_end_date: moment().utc().add(11, 'days').toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/space-events/with-photo')
      .attach('photo', './test/files/event-test.png')
      .field(eventData)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken);
    expect(response.status).toEqual(HttpStatus.CREATED);
    expect(response.body.is_approved).toEqual(true);
    createdSpaceEvents.push(response.body);
  });

  it('/api/space-events (POST) with conflict event start and end date', async () => {
    const eventData: CreateSpaceEventDto = {
      title: 'test event',
      description: 'test stuff',
      event_start_date: moment().utc().add(40, 'days').toISOString(),
      event_end_date: moment().utc().add(60, 'days').toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/space-events')
      .send(eventData)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken);
    expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('/api/space-events (POST) with conflict through event start date', async () => {
    const eventData: CreateSpaceEventDto = {
      title: 'test event',
      description: 'test stuff',
      event_start_date: moment().utc().add(60, 'days').toISOString(),
      event_end_date: moment().utc().add(150, 'days').toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/space-events')
      .send(eventData)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken);
    expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('/api/space-events (POST) with conflict through event end date', async () => {
    const eventData: CreateSpaceEventDto = {
      title: 'test event',
      description: 'test stuff',
      event_start_date: moment().utc().add(20, 'days').toISOString(),
      event_end_date: moment().utc().add(40, 'days').toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/space-events')
      .send(eventData)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken);
    expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('/api/space-events (POST) with conflict and over-exceed through event end date', async () => {
    const eventData: CreateSpaceEventDto = {
      title: 'test event',
      description: 'test stuff',
      event_start_date: moment().utc().add(20, 'days').toISOString(),
      event_end_date: moment().utc().add(150, 'days').toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/space-events')
      .send(eventData)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken);
    expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('/api/space-events (POST) without conflict event start and end date', async () => {
    const eventData: CreateSpaceEventDto = {
      title: 'test event',
      description: 'test stuff',
      event_start_date: moment().utc().add(140, 'days').toISOString(),
      event_end_date: moment().utc().add(150, 'days').toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/space-events')
      .send(eventData)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken);
    expect(response.status).toEqual(HttpStatus.CREATED);
    expect(response.body.is_approved).toEqual(true);
    createdSpaceEvents.push(response.body);
  });

  it('/api/space-events/latest (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/space-events/latest')
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body).toHaveLength(createdSpaceEvents.length);
    createdSpaceEvents.forEach((createdSpaceEvent) => {
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: createdSpaceEvent.id }),
        ]),
      );
    });
  });

  it('/api/space-events/upcoming (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/space-events/upcoming')
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body.data).toBeDefined();
    createdSpaceEvents.forEach((createdSpaceEvent) => {
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: createdSpaceEvent.id }),
        ]),
      );
    });
    expect(response.body.current_page).toEqual(1);
    expect(response.body.last_page).toEqual(1);
    expect(response.body.total_count).toEqual(createdSpaceEvents.length);
  });

  it('/api/space-events (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/space-events')
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body.data).toBeDefined();
    createdSpaceEvents.forEach((createdSpaceEvent) => {
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: createdSpaceEvent.id }),
        ]),
      );
    });
    expect(response.body.current_page).toEqual(1);
    expect(response.body.last_page).toEqual(1);
    expect(response.body.total_count).toEqual(createdSpaceEvents.length);
  });

  it('/api/space-events/:id (GET) with invalid ID', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/space-events/abcde-fac')
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.NOT_FOUND);
  });

  it('/api/space-events/:id (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/space-events/' + createdSpaceEvents[0].id)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body).toEqual(
      expect.objectContaining({ id: createdSpaceEvents[0].id }),
    );
    expect(response.body.is_approved).toEqual(true);
    expect(response.body.organizer).toBeDefined();
    expect(response.body.host).toBeDefined();
    expect(response.body.photo).toBeNull();
  });

  it('/api/space-events/:id (POST)', async () => {
    const newSpaceEventDetails = {
      title: randomStringGenerator(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/space-events/' + createdSpaceEvents[0].id)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken)
      .send(newSpaceEventDetails);
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body).toEqual(
      expect.objectContaining({ id: createdSpaceEvents[0].id }),
    );
    expect(response.body.is_approved).toEqual(true);
    expect(response.body.title).toEqual(newSpaceEventDetails.title);
    expect(response.body.organizer).toBeDefined();
    expect(response.body.host).toBeDefined();
    expect(response.body.photo).toBeNull();
  });

  it('/api/space-events/:id (POST) as not organizer', async () => {
    const newSpaceEventDetails = {
      title: randomStringGenerator(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/space-events/' + createdSpaceEvents[1].id)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken)
      .send(newSpaceEventDetails);
    expect(response.status).toEqual(HttpStatus.FORBIDDEN);
  });

  it('/api/space-events/:id (POST) update with time', async () => {
    const newSpaceEventDetails = {
      title: randomStringGenerator(),
      event_start_date: moment()
        .utc()
        .add(31, 'days')
        .startOf('minute')
        .toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/space-events/' + createdSpaceEvents[0].id)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken)
      .send(newSpaceEventDetails);
    expect(response.status).toEqual(HttpStatus.OK);
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

  it('/api/space-events/:id (POST) update with conflict event_start_date', async () => {
    const newSpaceEventDetails = {
      title: randomStringGenerator(),
      event_start_date: moment()
        .utc()
        .add(10, 'days')
        .startOf('minute')
        .toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/space-events/' + createdSpaceEvents[0].id)
      .set('Accept', 'application/json')
      .set('Authorization', memberLoginToken)
      .send(newSpaceEventDetails);
    expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('/api/space-events/:id (GET) for ones with photo should have photo', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/space-events/' + createdSpaceEvents[2].id)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body).toEqual(
      expect.objectContaining({ id: createdSpaceEvents[2].id }),
    );
    expect(response.body.is_approved).toEqual(true);
    expect(response.body.host).toBeDefined();
    expect(response.body.organizer).toBeDefined();
    expect(response.body.photo).toBeDefined();
    const photoFileId = response.body.photo.id;
    const photoResponse = await request(app.getHttpServer()).get(
      '/api/photos/' + photoFileId + '/view',
    );
    expect(photoResponse.status).toEqual(HttpStatus.OK);
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
    adminLoginToken = 'Bearer ' + adminTokenResponse.login_token.value;
    return app;
  });

  it('/api/admin/user-management/:id/add-membership (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/admin/user-management/' + validUser.id + '/add-membership')
      .set('Accept', 'application/json')
      .set('Authorization', adminLoginToken);
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body.id).toEqual(validUser.id);
    expect(response.body.is_member).toEqual(true);
  });

  it('/api/admin/user-management/:id/remove-membership (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/admin/user-management/' + validUser.id + '/remove-membership')
      .set('Accept', 'application/json')
      .set('Authorization', adminLoginToken);
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body.id).toEqual(validUser.id);
    expect(response.body.is_member).toEqual(false);
  });
});

describe('Inventory Management Flow (e2e)', () => {
  let adminLoginToken: string = '';
  let userLoginToken: string = '';
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
  let createdCategoryId: string = '';
  let createdInventoryId: string = '';

  beforeAll(async () => {
    await e2eHelper.resetDatabase();
    validUser = await e2eHelper.createValidUser(validUserData);
    adminUser = await e2eHelper.createValidAdmin(validAdminData);
    const userTokenResponse: UserTokenDto =
      await e2eHelper.createValidLoginToken(validUser);
    userLoginToken = 'Bearer ' + userTokenResponse.login_token.value;
    const adminTokenResponse: UserTokenDto =
      await e2eHelper.createValidLoginToken(adminUser);
    adminLoginToken = 'Bearer ' + adminTokenResponse.login_token.value;
    return app;
  });

  it('/api/inventory-categories (POST)', async () => {
    const inventoryCategory: Partial<CreateInventoryCategoryDto> = {
      title: randomStringGenerator(),
      description: randomStringGenerator() + ' ' + randomStringGenerator(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/inventory-categories')
      .set('Accept', 'application/json')
      .set('Authorization', adminLoginToken)
      .send(inventoryCategory);
    expect(response.status).toEqual(HttpStatus.CREATED);
    expect(response.body.title).toEqual(inventoryCategory.title);
    expect(response.body.description).toEqual(inventoryCategory.description);
    expect(response.body.id).toBeDefined();
    createdCategoryId = response.body.id;
  });

  it('/api/inventory-categories (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/inventory-categories')
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body.data).toBeDefined();
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createdCategoryId,
        }),
      ]),
    );
    expect(response.body.current_page).toEqual(1);
    expect(response.body.last_page).toEqual(1);
    expect(response.body.total_count).toEqual(1);
  });

  it('/api/inventory-categories/:id (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/inventory-categories/' + createdCategoryId)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body.id).toEqual(createdCategoryId);
  });

  it('/api/inventory-categories/abcde-f (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/inventory-categories/abcde-f')
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.NOT_FOUND);
  });

  it('/api/inventory-categories/:id (POST)', async () => {
    const inventoryCategory: Partial<UpdateInventoryCategoryDto> = {
      title: randomStringGenerator(),
      description: randomStringGenerator() + ' ' + randomStringGenerator(),
    };
    const response = await request(app.getHttpServer())
      .post('/api/inventory-categories/' + createdCategoryId)
      .set('Accept', 'application/json')
      .set('Authorization', adminLoginToken)
      .send(inventoryCategory);
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body.title).toEqual(inventoryCategory.title);
    expect(response.body.description).toEqual(inventoryCategory.description);
  });

  it('/api/inventory-items (POST)', async () => {
    const inventoryItem: Partial<CreateInventoryItemDto> = {
      title: randomStringGenerator(),
      description: randomStringGenerator() + ' ' + randomStringGenerator(),
      item_count: randomInt(1, 100),
      is_in_space: true,
      is_working: true,
      owned_by_user_id: validUser.id,
      maintained_by_user_id: validUser.id,
      category_id: createdCategoryId,
    };
    const response = await request(app.getHttpServer())
      .post('/api/inventory-items')
      .set('Accept', 'application/json')
      .set('Authorization', adminLoginToken)
      .send(inventoryItem);
    expect(response.status).toEqual(HttpStatus.CREATED);
    expect(response.body.title).toEqual(inventoryItem.title);
    expect(response.body.description).toEqual(inventoryItem.description);
    expect(response.body.item_count).toEqual(inventoryItem.item_count);
    expect(response.body.is_in_space).toEqual(inventoryItem.is_in_space);
    expect(response.body.is_working).toEqual(inventoryItem.is_working);
    expect(response.body.created_by).toBeDefined();
    expect(response.body.created_by.id).toEqual(adminUser.id);
    expect(response.body.owned_by).toBeDefined();
    expect(response.body.owned_by.id).toEqual(validUser.id);
    expect(response.body.maintained_by).toBeDefined();
    expect(response.body.maintained_by.id).toEqual(validUser.id);
    expect(response.body.category).toBeDefined();
    expect(response.body.category.id).toEqual(inventoryItem.category_id);
    expect(response.body.photo).toBeUndefined();
    createdInventoryId = response.body.id;
  });

  it('/api/inventory-items/with-photo (POST)', async () => {
    const inventoryItem: Partial<CreateInventoryItemDto> = {
      title: randomStringGenerator(),
      description: randomStringGenerator() + ' ' + randomStringGenerator(),
      item_count: randomInt(1, 100),
      is_in_space: true,
      is_working: true,
      owned_by_user_id: validUser.id,
      maintained_by_user_id: validUser.id,
    };
    const response = await request(app.getHttpServer())
      .post('/api/inventory-items/with-photo')
      .attach('photo', './test/files/event-test.png')
      .field(inventoryItem)
      .set('Accept', 'application/json')
      .set('Authorization', adminLoginToken);
    expect(response.status).toEqual(HttpStatus.CREATED);
    expect(response.body.title).toEqual(inventoryItem.title);
    expect(response.body.description).toEqual(inventoryItem.description);
    expect(response.body.item_count).toEqual(inventoryItem.item_count);
    expect(response.body.is_in_space).toEqual(inventoryItem.is_in_space);
    expect(response.body.is_working).toEqual(inventoryItem.is_working);
    expect(response.body.created_by).toBeDefined();
    expect(response.body.created_by.id).toEqual(adminUser.id);
    expect(response.body.owned_by).toBeDefined();
    expect(response.body.owned_by.id).toEqual(validUser.id);
    expect(response.body.maintained_by).toBeDefined();
    expect(response.body.maintained_by.id).toEqual(validUser.id);
    expect(response.body.photo).toBeDefined();
  });

  it('/api/inventory-items (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/inventory-items')
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body.data).toBeDefined();
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createdInventoryId,
        }),
      ]),
    );
    expect(response.body.current_page).toEqual(1);
    expect(response.body.last_page).toEqual(1);
    expect(response.body.total_count).toEqual(2);
  });

  it('/api/inventory-items/:id (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/inventory-items/' + createdInventoryId)
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body.id).toEqual(createdInventoryId);
    expect(response.body.created_by).toBeDefined();
    expect(response.body.created_by.id).toEqual(adminUser.id);
    expect(response.body.owned_by).toBeDefined();
    expect(response.body.owned_by.id).toEqual(validUser.id);
    expect(response.body.maintained_by).toBeDefined();
    expect(response.body.maintained_by.id).toEqual(validUser.id);
    expect(response.body.category).toBeDefined();
    expect(response.body.category.id).toEqual(createdCategoryId);
    expect(response.body.photo).toBeNull();
  });

  it('/api/inventory-items/abcde-f (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/inventory-items/abcde-f')
      .set('Accept', 'application/json');
    expect(response.status).toEqual(HttpStatus.NOT_FOUND);
  });

  it('/api/inventory-items/:id (POST)', async () => {
    const inventoryItem: Partial<UpdateInventoryItemDto> = {
      title: randomStringGenerator(),
      description: randomStringGenerator() + ' ' + randomStringGenerator(),
      item_count: randomInt(1, 100),
    };
    const response = await request(app.getHttpServer())
      .post('/api/inventory-items/' + createdInventoryId)
      .set('Accept', 'application/json')
      .set('Authorization', adminLoginToken)
      .send(inventoryItem);
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.body.id).toEqual(createdInventoryId);
    expect(response.body.title).toEqual(inventoryItem.title);
    expect(response.body.description).toEqual(inventoryItem.description);
    expect(response.body.item_count).toEqual(inventoryItem.item_count);
    expect(response.body.created_by).toBeDefined();
    expect(response.body.owned_by).toBeDefined();
    expect(response.body.maintained_by).toBeDefined();
    expect(response.body.category).toBeDefined();
    expect(response.body.photo).toBeNull();
  });
});
