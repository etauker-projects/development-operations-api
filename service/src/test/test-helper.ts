import assert from 'assert';

export class TestHelper {
    
    public static assertThrows(
        executeTest: Function,
        expectedCode: number,
        expectedMessage: string,
    ): void {
        try {
            executeTest();
            assert.fail('error should have thrown exception');
        } catch (error) {
            assert.equal(error?.code, expectedCode, `error code should be '${ expectedCode }'`);
            assert.equal(error?.message, expectedMessage, `error message should be '${ expectedMessage }'`);
        }
    }

}