import { expect } from 'chai';
import { catchError } from '../../../src/lib/catchError.js';

describe('catchError', () => {
    it('should return [undefined, result] for resolved promises', async () => {
        const promise = Promise.resolve('success');
        const result = await catchError(promise);

        expect(result).to.deep.equal([undefined, 'success']);
    });

    it('should return [error] for rejected promises', async () => {
        const error = new Error('test error');
        const promise = Promise.reject(error);
        const result = await catchError(promise);

        expect(result).to.deep.equal([error]);
    });

    it('should handle promises with complex objects', async () => {
        const complexObject = {
            id: 1,
            name: 'test',
            nested: { value: 42 },
        };
        const promise = Promise.resolve(complexObject);
        const result = await catchError(promise);

        expect(result).to.deep.equal([undefined, complexObject]);
    });

    it('should handle promises with null values', async () => {
        const promise = Promise.resolve(null);
        const result = await catchError(promise);

        expect(result).to.deep.equal([undefined, null]);
    });

    it('should handle promises with undefined values', async () => {
        const promise = Promise.resolve(undefined);
        const result = await catchError(promise);

        expect(result).to.deep.equal([undefined, undefined]);
    });

    it('should handle string rejection', async () => {
        const promise = Promise.reject('string error');
        const result = await catchError(promise);

        expect(result).to.deep.equal(['string error']);
    });

    it('should handle async functions', async () => {
        const asyncFn = async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return 'delayed result';
        };

        const result = await catchError(asyncFn());
        expect(result).to.deep.equal([undefined, 'delayed result']);
    });

    it('should handle async functions that throw', async () => {
        const asyncFn = async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            throw new Error('async error');
        };

        const result = await catchError(asyncFn());
        expect(result[0]).to.be.instanceOf(Error);
        expect(result[0]?.message).to.equal('async error');
    });
});
