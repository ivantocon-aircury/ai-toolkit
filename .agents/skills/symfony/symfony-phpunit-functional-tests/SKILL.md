---
name: symfony-phpunit-functional-tests
description: Create, edit, or review PHPUnit functional tests for Symfony/PHP API projects. Use this skill whenever the user asks for functional tests, controller/API endpoint tests, WebTestCase/KernelBrowser tests, Symfony PHPUnit tests, auth/permission matrix tests, fixture-backed database tests, upload/download tests, mailer assertions, or repository side-effect checks in PHP projects, even if they only say "add tests" for an endpoint or service behavior.
---

# Symfony PHPUnit Functional Tests

Use this skill to add Symfony/PHPUnit functional tests that fit the project's existing test suite. These repositories share a strong convention: functional tests should look like the local tests around them, use the project's base test classes and fixtures, and verify behavior through HTTP responses plus important database side effects.

## First Pass

Before writing a test, inspect the current project rather than assuming a generic PHPUnit setup.

Look for:

- `phpunit.xml.dist` or `phpunit.dist.xml` to confirm bootstrap, environment, and test paths.
- `tests/Functional`, especially nearby controller/API tests for the same resource.
- Base classes such as `tests/Functional/AbstractWebTestCase.php`, `tests/Functional/Controller/AbstractWebTestCase.php`, `tests/Util/AbstractWebTestCase.php`, or `tests/AbstractKernelTestCase.php`.
- Traits/constants such as `TestsConstantsTrait`, `WebTestAssertionsTrait`, `MailerAssertionsTrait`, and project-specific `getResponseContentAsArray()` helpers.
- Fixture users, role constants, and auth helpers before inventing emails or roles.
- Existing `src/Service/TestDataGenerator` classes before hand-building entity graphs.
- Makefile targets such as `db-test`, `phpunit`, and `tests` as documentation for the intended container/service/working-directory commands. Do not run `make` directly.

The goal is not to introduce a new testing style. The goal is to extend the suite in the style a maintainer would expect.

## Common Project Pattern

Most functional API tests in these projects use:

- Symfony `WebTestCase` or a project `AbstractWebTestCase` wrapper.
- `KernelBrowser` with `$this->client->request(...)` and named arguments.
- `$this->client->disableReboot()` in the base class.
- Hautelook Alice `RefreshDatabaseTrait` with `RefreshDatabaseState::setDbPopulated(true)` in the base setup.
- Fixture-backed users and roles, often exposed as constants.
- JWT auth helpers such as `generateServerParamByEmail()`, `generateServerParam()`, or `generateTokenByEmail()`.
- JSON payloads encoded with `json_encode($payload, JSON_THROW_ON_ERROR)`.
- Response bodies decoded with a local helper or `json_decode(..., true, 512, JSON_THROW_ON_ERROR)`.
- Repository/entity checks after mutating requests.
- PHPUnit attributes like `#[DataProvider('...')]` for role/permission matrices.

## File Placement And Naming

Place tests where the matching tests already live.

Common locations:

- `tests/Functional/Controller/<Domain>/...`
- `tests/Functional/Controller/Api/<Domain>/...`
- `tests/Functional/<Domain>/...`
- `tests/Functional/Repository/...` for repository behavior that needs a real database.
- `tests/Functional/Command/...` for command behavior using `CommandTester` with real services.

Name controller tests after the HTTP method and action/resource, matching the project style:

- `GetBooksControllerTest`
- `PostCreateBookControllerTest`
- `PutUpdateMembershipControllerTest`
- `DeleteGroupTest`
- `DownloadTrialTemplateTest`

Name methods as behavior, not implementation:

- `testAdminCanCreateBook`
- `testTeacherCannotCreateStudentInAnotherSchool`
- `testEndpointReturnsForbiddenForNonAdminUsers`
- `testSearchMatchesNormalisedQueries`

## Test Shape

Follow this shape for API endpoint tests:

```php
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpFoundation\Response;

final class PostCreateExampleControllerTest extends AbstractWebTestCase
{
    #[DataProvider('dataProviderForTestUsersCanCreateExample')]
    public function testUsersCanCreateExample(?string $email, int $expectedStatusCode): void
    {
        $this->client->request(
            method: 'POST',
            uri: '/api/examples',
            server: self::generateServerParamByEmail($email),
            content: json_encode([
                'name' => 'Example',
            ], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame($expectedStatusCode);
    }

    public static function dataProviderForTestUsersCanCreateExample(): iterable
    {
        yield 'Not logged user' => [null, Response::HTTP_UNAUTHORIZED];
        yield 'Basic user' => [self::BASIC_USER_EMAIL, Response::HTTP_FORBIDDEN];
        yield 'Admin user' => [self::ADMIN_USER_EMAIL, Response::HTTP_CREATED];
    }
}
```

Adapt names, helpers, constants, and expected statuses to the actual project. Some projects use `generateServerParam(...)` instead of `generateServerParamByEmail(...)`; some define role constants in a trait; others use fixture emails directly.

## What To Assert

Assert at the boundary first, then assert durable effects when they matter.

Prefer:

- `self::assertResponseStatusCodeSame(Response::HTTP_OK)` or the local equivalent.
- `self::assertResponseIsSuccessful()` when existing tests use it for broad success.
- Decoded JSON assertions for stable API contract fields: `id`, `data`, `meta`, nested IDs, error codes.
- Repository checks after create/update/delete requests.
- Entity state checks for side effects that the response does not fully prove.
- Count and membership assertions for list/search endpoints.
- Mailer assertions using the project's existing mail testing trait/helpers.
- Filesystem or storage assertions only when existing tests already expose a test-safe mock/service.

Avoid brittle assertions:

- Do not assert the entire JSON response unless nearby tests do so and the response is intentionally stable.
- Do not depend on auto-generated IDs or Faker values unless the test creates deterministic data.
- Do not duplicate framework behavior already covered by Symfony or PHPUnit.

## Auth And Permission Matrices

Many endpoint tests should include a small role matrix because these APIs distinguish unauthenticated, forbidden, and allowed users.

Use the project's existing roles and fixtures:

- Anonymous or not logged in: usually `null` server params or omitted auth.
- Basic/teacher/mentor users: usually expect `403` for admin-only actions.
- Admin/super-admin users: often the allowed case, but check local policy.
- Cross-tenant or cross-organisation users: add explicit tests where ownership matters.

Keep the matrix focused. A data provider is useful for broad access rules, but write separate tests for business-specific invalid cases so failures are easy to diagnose.

## Test Data

Prefer the lightest reliable data source:

1. Existing fixtures for common users, roles, organisations, schools, categories, groups, and stable reference entities.
2. Existing `TestDataGenerator` services when a test needs fresh entities or complex relations.
3. Direct entity construction only for small repository tests or when nearby tests already do it.

When using generators:

```php
$book = self::getService(BookTestDataGenerator::class)->generate([
    'title' => 'Existing title',
]);

self::getService(EntityManagerInterface::class)->flush();
```

Most generators persist by default but do not always flush. Check the generator and nearby tests, then flush explicitly when the next step depends on database state.

## Uploads, Downloads, Commands, And Mail

For uploads:

- Reuse files under `tests/files`.
- Use `Symfony\Component\HttpFoundation\File\UploadedFile`.
- If a file must be modified, copy it to a temp path first so the fixture file is not consumed or mutated.
- Match existing multipart server/header conventions.

For downloads:

- Assert status, headers, and meaningful content only as far as stable.
- If storage is mocked in existing tests, inject the same test container service or trait pattern.

For commands:

- Use Symfony `CommandTester`.
- Assert exit code, relevant output text, and database effects.

For mail:

- Use existing Symfony mailer assertions or project mail traits.
- Assert subject/recipient/template-level behavior rather than full rendered HTML unless the suite already does that.

## Running Commands And Tests

Use the Makefile as documentation, not as the command runner. These projects usually encode the correct service name, container user, working directory, and PHPUnit command in Makefile targets, but the actual command should be run with `docker compose` inside the container.

- Inspect the relevant Makefile target to understand what it would do.
- Translate it to the equivalent `docker compose exec` or `docker compose run` command.
- Run PHPUnit, Symfony console, migrations, fixture loading, and any project command inside the container every time.
- Use the same service name, user, and working directory shown by the Makefile or nearby project docs.
- Prefer targeted PHPUnit paths inside the container when verifying a focused test change.
- Prefer `docker compose run --rm` for isolated checks. Do not pass `--service-ports`: service ports are not published by default for `run`, and automated tests do not need host access.
- Do not use `docker compose up` solely to run tests, because it applies the stack's configured host port mappings. If tests need dependencies, use the project's documented port-free test profile or override, or start only required dependencies without published ports.

Examples of the expected shape, adapted to the current project:

```bash
docker compose exec --user=www-data apps sh -lc 'cd api && bin/phpunit tests/Functional/Controller/Book/PostCreateBookControllerTest.php'
docker compose run --rm apps sh -lc 'cd ./projects/api && vendor/bin/phpunit tests/Functional/Controller/Student/PostCreateStudentControllerTest.php'
docker compose exec apps sh -lc 'cd api && bin/console doctrine:migrations:migrate --env=test --no-interaction'
```

Do not run `make db-test`, `make phpunit`, host `php`, host `composer`, or host `bin/phpunit` directly. The container is the source of truth for PHP version, extensions, environment variables, and installed dependencies.

## Review Checklist

Before finishing, check that the test:

- Extends the same base class as nearby functional tests.
- Uses existing auth helpers and constants.
- Uses existing fixture/generator conventions.
- Covers success, unauthenticated, forbidden, and key validation/error cases where relevant.
- Verifies database side effects for mutations.
- Uses `JSON_THROW_ON_ERROR` for JSON payloads/decoding.
- Avoids brittle full-response assertions and random Faker-dependent expectations.
- Runs with the smallest relevant `docker compose` command inside the container.
