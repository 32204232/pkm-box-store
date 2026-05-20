package com.pkm.store;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "DB_PASSWORD=test",
        "JWT_SECRET=test-secret-for-context-load-must-be-at-least-32-bytes",
        "AWS_ACCESS_KEY_ID=test-access-key",
        "AWS_SECRET_ACCESS_KEY=test-secret-key",
        "AWS_S3_BUCKET=test-bucket",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect"
})
class PkmStoreApplicationTests {

    @Test
    void contextLoads() {
    }
}
