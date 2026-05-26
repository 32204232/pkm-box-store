package com.pkm.store;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "DB_URL=jdbc:h2:mem:pkm_store_context_test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
        "DB_USERNAME=sa",
        "DB_PASSWORD=test",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "JWT_SECRET=test-secret-for-context-load-must-be-at-least-32-bytes",
        "AWS_ACCESS_KEY_ID=test-access-key",
        "AWS_SECRET_ACCESS_KEY=test-secret-key",
        "AWS_S3_BUCKET=test-bucket",
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"
})
class PkmStoreApplicationTests {

    @Test
    void contextLoads() {
    }
}
