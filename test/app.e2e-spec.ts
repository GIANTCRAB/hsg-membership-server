import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication, ValidationPipe} from '@nestjs/common';
import * as request from 'supertest';
import {AppModule} from '../src/app.module';

describe('AppController (e2e)', () => {
    let app: INestApplication;

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

    it('/user-login (POST)', () => {
        const userData = {
            email: "test@example.org",
            password: "password123",
        }
        return request(app.getHttpServer())
            .post('/user-login')
            .send(userData)
            .set('Accept', 'application/json')
            .expect(201);
    });
});
