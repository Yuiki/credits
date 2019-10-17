import React, { useState } from 'react';
import { Accordion, Badge, Button, ButtonToolbar, Card, Col, Dropdown, Form, ListGroup } from "react-bootstrap";
import Course from "./Course";
import CourseList from "./CourseList";
import RegistrationStatus from "./RegistrationStatus";
import Requirements, { RegisteredCreditsCounts, RequirementWithChildren, RequirementWithCourses, SelectionRequirement } from "./Requirements";

const CreditsCountLabelDelimiter = () => (<span className="text-muted"> / </span>)

const ExceededCreditsCountLabel = ({ creditsCount }: { creditsCount: number }) => (
    <>
        <span className="text-muted">(</span>
        +{creditsCount}
        <span className="text-muted">)</span>
    </>
);

const CreditsCountLabels = ({ requirement, courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount }: {
    requirement: Requirements,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, Requirements>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
}) => {
    const creditsCount = requirement.getRegisteredCreditsCount({ courseToRequirement, courseToStatus, selectionToRequirement, requirementToOthersCount, includesExcess: false });
    const exceededCreditsCount = requirement.getRegisteredCreditsCount({ courseToRequirement, courseToStatus, selectionToRequirement, requirementToOthersCount, includesExcess: true });
    const requiredCreditsCount = requirement.getRequiredCreditsCount(selectionToRequirement);

    return (
        <div>
            <span>
                <span className="text-muted">習得</span>
                <> </>
                <strong className="text-success">{creditsCount.acquired}</strong>
                {exceededCreditsCount.acquired > creditsCount.acquired ? (<ExceededCreditsCountLabel creditsCount={exceededCreditsCount.acquired - creditsCount.acquired} />) : (<></>)}
            </span>
            <CreditsCountLabelDelimiter />
            <span>
                <span className="text-muted">履修</span>
                <> </>
                <strong className="text-primary">{creditsCount.registered}</strong>
                {exceededCreditsCount.registered > creditsCount.registered ? (<ExceededCreditsCountLabel creditsCount={exceededCreditsCount.registered - creditsCount.registered} />) : (<></>)}
            </span>
            <CreditsCountLabelDelimiter />
            <span>
                <span className="text-muted">必要</span>
                <> </>
                <strong>
                    {
                        requiredCreditsCount.min === requiredCreditsCount.max ?
                            requiredCreditsCount.min :
                            `${requiredCreditsCount.min}~${requiredCreditsCount.max}`
                    }
                </strong>
            </span>
        </div>
    )
};

export const RequirementSummaryView = ({ requirement, courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount }: {
    requirement: Requirements,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, Requirements>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
}) => {
    const status = requirement.getStatus({ courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount });
    return (
        <>
            <h5 className="d-flex justify-content-between align-items-center">
                <div>{requirement.title}</div>
                <Badge className="ml-2 flex-shrink-0" variant={status === RegistrationStatus.Acquired ? 'success' : status === RegistrationStatus.Registered ? 'primary' : 'secondary'}>
                    {status === RegistrationStatus.Acquired ? '修得OK' : status === RegistrationStatus.Registered ? '履修OK' : '不足'}
                </Badge>
            </h5>
            <div>
                {requirement.description === undefined ? (<></>) : (<div className="text-muted">{requirement.description}</div>)}
                <CreditsCountLabels
                    requirement={requirement}
                    courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                    selectionToRequirement={selectionToRequirement} requirementToOthersCount={requirementToOthersCount}
                />
            </div>
        </>
    );
}

const RequirementWithChildrenView = ({ requirement, showsOnlyRegistered, courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount, onCourseClick, onOthersCountsChange, onSelectionChange }: {
    requirement: RequirementWithChildren,
    showsOnlyRegistered: boolean,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, RequirementWithCourses>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onOthersCountsChange: (requirement: RequirementWithCourses, newOthersCount: RegisteredCreditsCounts) => void,
    onSelectionChange: (selection: SelectionRequirement, chosen: Requirements) => void,
}) => (
        <>
            <RequirementSummaryView
                requirement={requirement}
                courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                selectionToRequirement={selectionToRequirement} requirementToOthersCount={requirementToOthersCount}
            />
            <ListGroup className="mt-3">
                {
                    requirement.children.map(child => (
                        <ListGroup.Item key={child.title}>
                            <RequirementView
                                requirement={child} showsOnlyRegistered={showsOnlyRegistered}
                                courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionToRequirement={selectionToRequirement}
                                onCourseClick={onCourseClick} onSelectionChange={onSelectionChange}
                                onOthersCountsChange={onOthersCountsChange} requirementToOthersCount={requirementToOthersCount}
                            />
                        </ListGroup.Item>
                    ))
                }
            </ListGroup>
        </>
    );

const OthersCountInput = ({ currentOthersCount, onReturn, onHide }: {
    currentOthersCount: RegisteredCreditsCounts,
    onReturn: (newOthersCount: RegisteredCreditsCounts) => void,
    onHide: () => void,
}) => {
    const [acquired, setAcquired] = useState(undefined as number | undefined);
    const [registeredExcludingAcquired, setRegisteredExcludingAcquired] = useState(undefined as number | undefined);
    const [registeredIncludingAcquired, setRegisteredIncludingAcquired] = useState(undefined as number | undefined);

    const computed = {
        acquired: acquired || currentOthersCount.acquired,
        registered:
            registeredIncludingAcquired !== undefined ?
                registeredIncludingAcquired :
                registeredExcludingAcquired !== undefined ?
                    (acquired !== undefined ? acquired : currentOthersCount.acquired) + registeredExcludingAcquired :
                    acquired !== undefined ?
                        currentOthersCount.registered + acquired - currentOthersCount.acquired :
                        currentOthersCount.registered,
    }

    return (
        <Card body border="primary">
            <Form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                onReturn(computed);
                onHide();
            }}>
                <Form.Row>
                    <Form.Group as={Col} md="4" controlId="validationCustom01">
                        <Form.Label>習得済みの単位数 <span className="text-muted">(a)</span></Form.Label>
                        <Form.Control
                            type="number" min={0}
                            placeholder={`${computed.acquired}`}
                            value={acquired === undefined ? '' : `${acquired}`}
                            onChange={
                                (e: React.ChangeEvent<HTMLInputElement>) =>
                                    setAcquired(e.target.value === '' ? undefined : +e.target.value)
                            }
                            isInvalid={computed.acquired < 0}
                        />
                        <Form.Control.Feedback type="invalid">(a) &gt;= 0</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group as={Col} md="4" controlId="validationCustom02">
                        <Form.Label>履修する単位数 <span className="text-muted">(b)</span></Form.Label>
                        <Form.Control
                            type="number" min={0}
                            placeholder={`${computed.registered - computed.acquired}`}
                            value={registeredExcludingAcquired === undefined ? '' : `${registeredExcludingAcquired}`}
                            onChange={
                                (e: React.ChangeEvent<HTMLInputElement>) => {
                                    if (e.target.value === '') {
                                        setRegisteredExcludingAcquired(undefined);
                                    } else {
                                        setRegisteredExcludingAcquired(+e.target.value);
                                        setRegisteredIncludingAcquired(undefined);
                                    }
                                }
                            }
                            isInvalid={computed.acquired > computed.registered}
                        />
                        <Form.Control.Feedback type="invalid">(b) &gt;= 0</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group as={Col} md="4" controlId="validationCustom02">
                        <Form.Label>計 <span className="text-muted">(a) + (b)</span></Form.Label>
                        <Form.Control
                            type="number" min={0}
                            placeholder={`${computed.registered}`}
                            value={registeredIncludingAcquired === undefined ? '' : `${registeredIncludingAcquired}`}
                            onChange={
                                (e: React.ChangeEvent<HTMLInputElement>) => {
                                    if (e.target.value === '') {
                                        setRegisteredIncludingAcquired(undefined);
                                    } else {
                                        setRegisteredIncludingAcquired(+e.target.value);
                                        setRegisteredExcludingAcquired(undefined);
                                    }
                                }
                            }
                        />
                    </Form.Group>
                </Form.Row>
                <ButtonToolbar>
                    <Button
                        type="submit"
                        disabled={computed.acquired < 0 || computed.acquired > computed.registered}
                    >OK</Button>
                    <Button variant="secondary" onClick={onHide}>キャンセル</Button>
                </ButtonToolbar>
            </Form>
        </Card>
    )
}

const RequirementWithCoursesView = ({ requirement, showsOnlyRegistered, courseToStatus, courseToRequirement, onCourseClick, onOthersCountsChange, selectionToRequirement, requirementToOthersCount }: {
    requirement: RequirementWithCourses,
    showsOnlyRegistered: boolean,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, Requirements>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onOthersCountsChange: (newOthersCount: RegisteredCreditsCounts) => void,
    onSelectionChange: (selection: SelectionRequirement, chosen: Requirements) => void,
}) => {
    const useIsOpen = () => {
        const [isOpenWhenFalse, setIsOpenWhenFalse] = useState(false);
        const [isOpenWhenTrue, setIsOpenWhenTrue] = useState(true);
        return showsOnlyRegistered ? [isOpenWhenTrue, setIsOpenWhenTrue] as const : [isOpenWhenFalse, setIsOpenWhenFalse] as const;
    };

    const [isOpen, setIsOpen] = useIsOpen();
    const [showsInput, setShowsInput] = useState(false);

    const courses = requirement.courses.filter(course =>
        !showsOnlyRegistered || (courseToStatus.get(course) !== RegistrationStatus.Unregistered &&
            requirement === courseToRequirement.get(course)));

    return (
        <>
            <Accordion activeKey={isOpen ? '0' : ''}>
                <div className={`bg-white ${isOpen ? 'sticky-top' : ''}`}>
                    <RequirementSummaryView
                        requirement={requirement}
                        courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                        selectionToRequirement={selectionToRequirement} requirementToOthersCount={requirementToOthersCount}
                    />
                    {
                        courses.length === 0 ?
                            requirement.allowsOthers ? (
                                showsInput ? (<></>) : (
                                    <Button block className="mt-3" variant="secondary" onClick={() => setShowsInput(true)}>
                                        単位数を入力
                                    </Button>
                                )
                            ) : (
                                    <Button block className="mt-3" variant="outline-secondary" disabled>
                                        {showsOnlyRegistered ? '履修する' : ''}科目はありません
                                    </Button>
                                ) : (
                                <Button
                                    block className="mt-3"
                                    onClick={() => setIsOpen(!isOpen)}
                                    variant={isOpen ? 'primary' : 'outline-secondary'}
                                >
                                    {showsOnlyRegistered ? '履修する' : ''}科目を{isOpen ? '非' : ''}表示
                                </Button>
                            )
                    }
                </div>
                {
                    showsInput ? (
                        <div className="mt-3">
                            <OthersCountInput
                                currentOthersCount={requirementToOthersCount.get(requirement) || { acquired: 0, registered: 0 }}
                                onReturn={onOthersCountsChange} onHide={() => setShowsInput(false)}
                            />
                        </div>
                    ) : (<></>)
                }
                <Accordion.Collapse eventKey="0">
                    {
                        courses.length === 0 ? (<></>) : (
                            <div className="mt-3">
                                <CourseList requirement={requirement} courses={courses}
                                    courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                                    onCourseClick={course => onCourseClick(course, requirement)} />
                            </div>
                        )
                    }
                </Accordion.Collapse>
            </Accordion>
        </>
    );
}

const SelectionRequirementView = ({ requirement, showsOnlyRegistered, courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount, onCourseClick, onOthersCountsChange, onSelectionChange }: {
    requirement: SelectionRequirement,
    showsOnlyRegistered: boolean,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, RequirementWithCourses>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onOthersCountsChange: (requirement: RequirementWithCourses, newOthersCount: RegisteredCreditsCounts) => void,
    onSelectionChange: (selection: SelectionRequirement, chosen: Requirements) => void,
}) => (
        <>
            <Dropdown>
                <Dropdown.Toggle id="" variant="secondary">{requirement.title} を変更</Dropdown.Toggle>

                <Dropdown.Menu style={{ zIndex: 1100 }}>
                    {
                        requirement.choices.map(choice => (
                            <Dropdown.Item key={choice.title}
                                active={choice === (selectionToRequirement.get(requirement) || requirement.choices[0])}
                                onClick={() => onSelectionChange(requirement, choice)}>
                                {choice.title}
                            </Dropdown.Item>
                        ))
                    }
                </Dropdown.Menu>
            </Dropdown>
            <div className="mt-3">
                <RequirementView
                    requirement={selectionToRequirement.get(requirement) || requirement.choices[0]}
                    showsOnlyRegistered={showsOnlyRegistered}
                    courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                    selectionToRequirement={selectionToRequirement} requirementToOthersCount={requirementToOthersCount}
                    onCourseClick={onCourseClick} onOthersCountsChange={onOthersCountsChange}
                    onSelectionChange={onSelectionChange}
                />
            </div>
        </>
    );

const RequirementView = ({ requirement, showsOnlyRegistered, courseToStatus, courseToRequirement, onCourseClick, onOthersCountsChange, onSelectionChange, selectionToRequirement, requirementToOthersCount }: {
    requirement: Requirements,
    showsOnlyRegistered: boolean,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, RequirementWithCourses>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onOthersCountsChange: (requirement: RequirementWithCourses, newOthersCount: RegisteredCreditsCounts) => void,
    onSelectionChange: (selection: SelectionRequirement, chosen: Requirements) => void,
}) =>
    requirement instanceof RequirementWithChildren ? (
        <RequirementWithChildrenView
            requirement={requirement} showsOnlyRegistered={showsOnlyRegistered}
            courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
            selectionToRequirement={selectionToRequirement} requirementToOthersCount={requirementToOthersCount}
            onCourseClick={onCourseClick} onOthersCountsChange={onOthersCountsChange} onSelectionChange={onSelectionChange}
        />
    ) :
        requirement instanceof RequirementWithCourses ? (
            <RequirementWithCoursesView
                requirement={requirement} showsOnlyRegistered={showsOnlyRegistered}
                courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                selectionToRequirement={selectionToRequirement} requirementToOthersCount={requirementToOthersCount}
                onCourseClick={onCourseClick} onSelectionChange={onSelectionChange}
                onOthersCountsChange={creditsCounts => onOthersCountsChange(requirement, creditsCounts)}
            />) :
            (
                <SelectionRequirementView
                    requirement={requirement} showsOnlyRegistered={showsOnlyRegistered}
                    courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                    selectionToRequirement={selectionToRequirement} requirementToOthersCount={requirementToOthersCount}
                    onCourseClick={onCourseClick} onOthersCountsChange={onOthersCountsChange} onSelectionChange={onSelectionChange}
                />
            );


export default RequirementView;
