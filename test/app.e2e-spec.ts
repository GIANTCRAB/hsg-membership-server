import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication, ValidationPipe} from '@nestjs/common';
import * as request from 'supertest';
import {AppModule} from '../src/app.module';
import {UserTokenDto} from "../src/controllers/login/user-token-dto";

describe('AppController (e2e)', () => {
    let app: INestApplication;
    let loginToken: string = '';

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule(
            {
                imports: [
                    AppModule,
                ],
            }
        )
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({transform: true}));
        await app.init();
    });

    it('/ (GET)', () => {
        return request(app.getHttpServer())
            .get('/')
            .expect(200)
            .expect('Hello World!');
    });

    it('/user-registration (POST)', () => {
        const userData = {
            email: "test@example.org",
            first_name: "test",
            last_name: "surname",
            password: "password123",
        }
        return request(app.getHttpServer())
            .post('/user-registration')
            .send(userData)
            .set('Accept', 'application/json')
            .expect(201);
    });

    it('/user-auth/login (POST)', async () => {
        const userData = {
            email: "test@example.org",
            password: "password123",
        }
        const response = await request(app.getHttpServer())
            .post('/user-auth/login')
            .send(userData)
            .set('Accept', 'application/json');
        expect(response.status).toEqual(201);
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
