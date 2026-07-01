---
name: symfony-controllers
description: Use when creating, editing, or reviewing Symfony API controllers under src/Controller, especially single-action __invoke controllers, route attributes, request DTO mapping, authorization calls, service/repository delegation, JSON responses, downloads, or controller refactors. Prefer this skill whenever the user mentions Symfony controllers, endpoints, routes, API actions, MapRequestPayload, MapQueryString, denyAccessUnlessGranted, or response DTOs.
---

# Symfony Controllers

Use this skill when working on Symfony API controllers that should follow a thin, single-action API controller style.

## Related Skills

- Use `symfony-services` for the application workflows that controllers should delegate to.
- Use `symfony-repositories` for read/list endpoints, filtering, pagination, and query DTO handling.
- Use `symfony-voters` for `denyAccessUnlessGranted()` calls, voter action constants, entity/entity-class subjects, and access policy details.

## Core Style

- Create one controller class per endpoint/action.
- Name controllers by HTTP verb plus action/resource, ending with `Controller`, for example `GetStudentsController`, `PostCreateStudentController`, `PutUpdateStudentController`, `DeleteSchoolController`, `DownloadTrialTemplateController`.
- Place controllers in a resource namespace: `App\Controller\Student`, `App\Controller\School`, `App\Controller\Trial`, etc.
- Keep controllers thin: receive mapped input, authorize, call one service/manager/repository, return a response.
- Put domain decisions, persistence, and multi-step workflows in services/managers/repositories, not in the controller.
- Prefer `__invoke()` single-action controllers.
- Keep dependencies specific to the endpoint. Do not inject broad services just for convenience.
- Avoid helper methods unless the controller has unavoidable repeated response-building logic.

## Routing

- Use PHP route attributes directly above `__invoke()`.
- Use API paths with `/api/...`.
- Set `methods` explicitly.
- Use entity parameters for route-bound resources where existing project routing supports it.
- Use UUID route requirements when the project does, usually `Requirement::UUID_V4`.
- Put role-only security next to the route with `#[IsGranted(...)]` when the project uses attributes for that endpoint.
- Prefer explicit voter checks with action constants and entity subjects.

```php
#[Route('/api/students/{id}', requirements: ['id' => Requirement::UUID_V4], methods: ['PUT'])]
public function __invoke(Student $student, #[MapRequestPayload] UpdateStudentDto $dto): Response
```

## Request Input

- In Symfony 6.3+ projects, prefer controller argument mapping over calling the denormalizer directly.
- For JSON bodies in Symfony 6.3+, use `#[MapRequestPayload]` on a DTO argument.
- For GET filters in Symfony 6.3+, use `#[MapQueryString]` on a query DTO argument.
- In older Symfony projects, or when argument mapping cannot handle the specific case, use `$request->toArray()` or `$request->query->all()` with `DenormalizerInterface`.
- For file uploads, read files from `$request->files` and delegate handling to a service.
- Keep request/query DTOs as input-only objects. Do not attach route entities, logged-in users, or authorization context to them.
- Pass route entities, current user, and other context as separate service arguments when the application layer needs them.

```php
public function __invoke(Student $student, #[MapRequestPayload] UpdateStudentDto $updateStudentDto): Response
```

```php
public function __invoke(#[MapQueryString] GetTrialsDto $dto): Response
```

```php
// Fallback for older Symfony versions.
$updateStudentDto = $this->denormalizer->denormalize($request->toArray(), UpdateStudentDto::class);
```

```php
// Fallback for older Symfony versions.
$dto = $this->denormalizer->denormalize($request->query->all(), GetTrialsDto::class);
```

## Validation

- Validate request/query DTOs before calling application services.
- With `#[MapRequestPayload]` and `#[MapQueryString]`, rely on Symfony's mapped validation by default.
- Keep explicit validation only when the project has a deliberate custom validation/error-response flow.
- In projects with `ValidatorService`, prefer `$this->validatorService->validateOrThrow($dto)` only when custom validation handling is required.
- Avoid manual `ValidatorInterface` plus bare `BadRequestHttpException`; it loses useful violation details.
- Do not silently ignore invalid request data.

```php
$this->validatorService->validateOrThrow($dto);
```

## Authorization

- Use explicit action constants declared on the voter.
- For existing resources, pass the original entity as the voter subject.
- For creates, list endpoints, and actions without an entity instance, pass `Entity::class` as the voter subject.
- Do not pass request/query DTOs to voters. DTOs are input shape; voters authorize against entities or the entity type.
- Keep authorization policy in voters; controllers should only choose the subject and call `denyAccessUnlessGranted()`.
- Do not use an empty voter attribute such as `''`; the action should be readable at the call site.
- Use `#[IsGranted(User::ROLE_ADMIN)]` or project-specific role expressions only for simple role gates.
- Get the logged-in user with `$this->getUser()` and add a docblock type assertion when the project's base controller does not type it.

```php
$this->denyAccessUnlessGranted(StudentVoter::UPDATE, $student);
$this->denyAccessUnlessGranted(SchoolVoter::CREATE, School::class);
```

## Services And Repositories

- Use repositories for reads and filtering.
- Use services/managers for mutations and workflows.
- Keep controller service calls intention-revealing: `createSchool($dto)`, `updateStudent($student, $dto)`, `createSecret($dto)`, `findTrials($dto)`.
- Do not inline Doctrine query builders, file storage, billing, email, encryption, or multi-entity workflows in controllers.
- Translate known domain exceptions to HTTP exceptions only at the boundary when the service exception should not leak directly.

```php
try {
    $user = $this->userManager->update($user, $dto);
} catch (InvalidUserSecretEncryptionKeysException $exception) {
    throw new BadRequestHttpException($exception->getMessage(), $exception);
}
```

## Responses

- Return `Response` from `__invoke()`.
- For commands with no response body, return `new Response(status: Response::HTTP_CREATED)` following the local style.
- For JSON payloads, return explicit response DTOs through Symfony's serializer.
- Create response DTOs for the specific endpoint shape being returned.
- Reuse response DTOs only when endpoints genuinely return the same content.
- Do not expose entities directly as JSON responses.
- Prefer response DTO constructors or named factories for mapping entities/results into response shapes.
- For collections, use a generic `CollectionResponse` with `items` and pagination properties such as `page`, `itemsPerPage`, and `totalItems`.
- For downloads, build a raw `Response`, set `Content-Type`, `Content-Disposition`, and cache headers explicitly.

```php
return $this->json(
    StudentResponse::fromEntity($student),
    status: Response::HTTP_OK,
);
```

```php
return $this->json(
    new CollectionResponse(
        items: array_map(
            static fn (Trial $trial): TrialResponse => TrialResponse::fromEntity($trial),
            $trials,
        ),
        page: $dto->page,
        itemsPerPage: $dto->itemsPerPage,
        totalItems: $totalItems,
    ),
);
```

```php
return new Response(null, Response::HTTP_CREATED);
```

## Common Templates

### Create Endpoint

```php
<?php declare(strict_types=1);

namespace App\Controller\School;

use App\Controller\AbstractController;
use App\Dto\School\CreateSchoolDto;
use App\Entity\School;
use App\Response\SchoolResponse;
use App\Service\SchoolService;
use App\Voter\SchoolVoter;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

class PostCreateSchoolController extends AbstractController
{
    public function __construct(
        private readonly SchoolService $schoolService,
    ) {}

    #[Route('/api/schools', methods: ['POST'])]
    public function __invoke(#[MapRequestPayload] CreateSchoolDto $createSchoolDto): Response
    {
        $this->denyAccessUnlessGranted(SchoolVoter::CREATE, School::class);

        $school = $this->schoolService->createSchool($createSchoolDto);

        return $this->json(
            SchoolResponse::fromEntity($school),
            Response::HTTP_CREATED,
        );
    }
}
```

### Update Endpoint

```php
#[Route('/api/students/{id}', requirements: ['id' => Requirement::UUID_V4], methods: ['PUT'])]
public function __invoke(Student $student, #[MapRequestPayload] UpdateStudentDto $studentDto): Response
{
    $this->denyAccessUnlessGranted(StudentVoter::UPDATE, $student);

    $student = $this->studentService->updateStudent($student, $studentDto);

    return $this->json(
        StudentResponse::fromEntity($student),
        Response::HTTP_OK,
    );
}
```

### List Endpoint

```php
#[Route('/api/trials', methods: ['GET'])]
public function __invoke(#[MapQueryString] GetTrialsDto $dto): Response
{
    $this->denyAccessUnlessGranted(TrialVoter::LIST, Trial::class);

    $trialsPaginator = $this->trialRepository->findTrials($dto);

    return $this->json(
        new CollectionResponse(
            items: array_map(
                static fn (Trial $trial): TrialResponse => TrialResponse::fromEntity($trial),
                iterator_to_array($trialsPaginator->getIterator()),
            ),
            page: $dto->page,
            itemsPerPage: $dto->itemsPerPage,
            totalItems: $trialsPaginator->count(),
        ),
    );
}
```

## Review Checklist

- Controller is single-action and named after the endpoint action.
- Route path, method, requirements, and security attributes match existing project conventions.
- Request input is mapped into an input-only DTO before business logic.
- Route entities, logged user context, and authorization context are not attached to request/query DTOs.
- Mapped DTO validation is handled by Symfony by default, or by an explicit project validation flow when required.
- Authorization uses explicit action constants and entity/class subjects.
- Request/query DTOs are not passed to voters.
- Mutations are delegated to a service or manager.
- Reads are delegated to repositories or query services.
- JSON responses use response-specific DTOs serialized by Symfony.
- Collection responses use `CollectionResponse` with `items` and pagination properties.
- Empty responses use `Response` with an explicit status.
- Domain exceptions are translated to appropriate Symfony HTTP exceptions.
- No unrelated business logic, persistence details, or serialization logic has leaked into the controller.
