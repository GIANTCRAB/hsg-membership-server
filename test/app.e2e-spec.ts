import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication, ValidationPipe} from '@nestjs/common';
import * as request from 'supertest';
import {AppModule} from '../src/app.module';
import {Connection, createConnection, getConnection} from "typeorm";
import {ConfigService} from "@nestjs/config";
import {TypeOrmConfigService} from "../src/services/type-orm-config.service";

describe('AppController (e2e)', () => {
    let app: INestApplication;
    let connection: Connection;

    beforeAll(async () => {
        if (!connection) {
            const configService = new ConfigService()
            connection = await createConnection((new TypeOrmConfigService(configService)).getTypeOrmConfig())
        }
    })

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule(
            {
                imports: [AppModule],
            }
        )
            .overrideProvider(Connection)
            .useValue(connection)
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
        return request(app.getHttpServer())
            .post('/user-registration')
            .expect(200)
            .expect('Hello World!');
    });
});
