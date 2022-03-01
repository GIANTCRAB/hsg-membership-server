import {INestApplication} from '@nestjs/common';
import * as request from 'supertest';
import {UserTokenDto} from "../src/controllers/login/user-token-dto";
import {TestE2eHelpers} from "./test-e2e-helpers";

describe('Authentication Flow (e2e)', () => {
    const e2eHelper = new TestE2eHelpers();
    let app: INestApplication;
    let loginToken: string = '';
    const validUserData = {
        email: "test@example.org",
        first_name: "test",
        last_name: "surname",
        password: "password123",
    }

    beforeAll(async () => {
        app = await e2eHelper.startServer();
    });

    afterAll(async () => {
        await e2eHelper.endServer();
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
        return await e2eHelper.createValidUser(validUserData);
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
