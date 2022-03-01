import {INestApplication} from '@nestjs/common';
import request from 'supertest';
import {UserTokenDto} from "../src/controllers/login/user-token-dto";
import {TestE2eHelpers} from "./test-e2e-helpers";
import {CreateSpaceEventDto} from "../src/controllers/space-events/create-space-event-dto";
import moment from "moment";
import {UserEntity} from "../src/entities/user.entity";

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
        email: "test@example.org",
        first_name: "test",
        last_name: "surname",
        password: "password123",
    };
    const bannedUserData = {
        email: "test5@example.org",
        first_name: "test",
        last_name: "surname",
        password: "password123",
    }

    beforeAll(async () => {
        await e2eHelper.resetDatabase();
        return app;
    });

    it('/user-registration (POST) with missing fields', () => {
        const userData = {
            email: "test@example.org",
            first_name: "test",
            last_name: "surname",
        }
        return request(app.getHttpServer())
            .post('/user-registration')
            .send(userData)
            .set('Accept', 'application/json')
            .expect(400);
    });

    it('/user-registration (POST) with empty fields', () => {
        const userData = {
            email: "test@example.org",
            first_name: "test",
            last_name: "surname",
            password: "",
        }
        return request(app.getHttpServer())
            .post('/user-registration')
            .send(userData)
            .set('Accept', 'application/json')
            .expect(400);
    });

    it('/user-registration (POST) with invalid email', () => {
        const userData = {
            email: "test",
            first_name: "test",
            last_name: "surname",
            password: "password123",
        }
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

    it('/user-auth/login (POST) with invalid email', async () => {
        const userData = {
            email: "test",
            password: validUserData.password,
        }
        const response = await request(app.getHttpServer())
            .post('/user-auth/login')
            .send(userData)
            .set('Accept', 'application/json');
        expect(response.status).toEqual(400);
    });

    it('/user-auth/login (POST) with incorrect password', async () => {
        const userData = {
            email: validUserData.email,
            password: "password12",
        }
        const response = await request(app.getHttpServer())
            .post('/user-auth/login')
            .send(userData)
            .set('Accept', 'application/json');
        expect(response.status).toEqual(422);
    });

    it('/user-auth/login (POST) with incorrect email', async () => {
        const userData = {
            email: "test2@example.org",
            password: validUserData.password,
        }
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
        }
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
        }
        const response = await e2eHelper.createValidLoginToken(userData);
        const userTokenResponse: UserTokenDto = response.body;
        loginToken = userTokenResponse.login_token.value;
        expect(userTokenResponse.login_token.is_valid).toEqual(true);
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

describe('Space Event Flow (e2e)', () => {
    let loginToken: string = '';
    const validUserData = {
        email: "test@example.org",
        first_name: "test",
        last_name: "surname",
        password: "password123",
    }
    let validUser: UserEntity;

    beforeAll(async () => {
        await e2eHelper.resetDatabase();
        validUser = await e2eHelper.createValidUser(validUserData);
        const userData = {
            email: validUserData.email,
            password: validUserData.password,
        }
        const response = await e2eHelper.createValidLoginToken(userData);
        const userTokenResponse: UserTokenDto = response.body;
        loginToken = userTokenResponse.login_token.value;
        return app;
    });

    it('/space-events/latest (GET)', async () => {
        const response = await request(app.getHttpServer())
            .get('/space-events/latest')
            .set('Accept', 'application/json');
        expect(response.status).toEqual(200);
    });

    it('/space-events (POST)', async () => {
        const eventData: CreateSpaceEventDto = {
            title: 'test event',
            description: 'test stuff',
            event_start_date: moment().utc().add(1, 'months').toISOString(),
            event_end_date: moment().utc().add(3, 'months').toISOString(),
        };
        console.log(moment().utc().add(1, 'months').toISOString());
        console.log(moment().utc().add(1, 'months').toDate().toISOString());
        const response = await request(app.getHttpServer())
            .post('/space-events')
            .send(eventData)
            .set('Accept', 'application/json')
            .set('Authorization', loginToken);
        console.log(response.body);
        expect(response.status).toEqual(201);
    });
});
