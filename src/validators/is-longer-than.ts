import {registerDecorator, ValidationArguments, ValidationOptions} from "class-validator";
import moment from "moment";

export function IsLongerThan(property: string, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isLongerThan',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[relatedPropertyName];
                    return typeof value === 'string' && typeof relatedValue === 'string' && moment(value).utc().isAfter(moment(relatedValue).utc()); // you can return a Promise<boolean> here as well, if you want to make async validation
                },
            },
        });
    };
}
