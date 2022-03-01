import {Test, TestingModule} from "@nestjs/testing";
import {AppModule} from "../src/app.module";
import {INestApplication, ValidationPipe} from "@nestjs/common";
import * as request from "supertest";
import {RegisterUserDto} from "../src/controllers/registration/register-user-dto";
import {LoginUserDto} from "../src/controllers/login/login-user-dto";
import {getConnection} from "typeorm";

export class TestE2eHelpers {
    app: INestApplication = null;
    testHelper: TestE2eHelpers = null;

    public async startServer(): Promise<INestApplication> {
        const moduleFixture: TestingModule = await Test.createTestingModule(
            {
                imports: [
                    AppModule,
                ],
            }
        )
            .compile();

        this.app = moduleFixture.createNestApplication();
        this.app.useGlobalPipes(new ValidationPipe({transform: true}));
        await this.app.init();
        return this.app;
    }

    public async stopServer() {
        return this.app.close();
    }

    public async resetDatabase(): Promise<void> {
        return getConnection().synchronize(true);
    }

    public async createValidUser(userData: RegisterUserDto) {
        const response = await request(this.app.getHttpServer())
            .post('/user-registration')
            .send(userData)
            .set('Accept', 'application/json');
        expect(response.status).toEqual(201);
        return response;
    }

    public async createValidLoginToken(loginData: LoginUserDto) {
        const response = await request(this.app.getHttpServer())
            .post('/user-auth/login')
            .send(loginData)
            .set('Accept', 'application/json');
        expect(response.status).toEqual(201);
        return response;
    }
}
