import React, { useState } from "react";
import { Button, Card, Modal } from "react-bootstrap";
import Course from "./Course";
import RegistrationStatus from "./RegistrationStatus";
import Requirements, { RequirementWithCourses, SelectionRequirement } from "./Requirements";
import { RequirementSummaryView } from "./RequirementView";

const CourseMovementConfirmationModal = ({ currentRequirement, courseToStatus, courseToRequirement, selectionToRequirement, onReturn, onExited }: {
    currentRequirement: RequirementWithCourses,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, Requirements>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    onReturn: (value: boolean) => void,
    onExited: () => void,
}) => {
    const [show, setShow] = useState(true);

    return (
        <Modal show={show} onHide={() => { setShow(false); onReturn(false); }} onExited={onExited}>
            <Modal.Header closeButton>
                <Modal.Title>割り当てる要件を変更</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>この科目はすでに以下の要件に割り当てられています。</p>
                <p>
                    各科目が割り当てできる要件は1つまでです。
                    <strong>続けると、この要件への割り当ては解除されます。</strong>
                </p>
                <Card body>
                    <RequirementSummaryView requirement={currentRequirement} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionToRequirement={selectionToRequirement} />
                </Card>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => { setShow(false); onReturn(false); }}>キャンセル</Button>
                <Button variant="primary" onClick={() => { setShow(false); onReturn(true); }}>続ける</Button>
            </Modal.Footer>
        </Modal>
    );
};

const confirmCourseMovement = async ({ currentRequirement, courseToStatus, courseToRequirement, selectionToRequirement, modals, setModals }: {
    currentRequirement: RequirementWithCourses,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, Requirements>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    modals: JSX.Element[],
    setModals: React.Dispatch<React.SetStateAction<JSX.Element[]>>
}): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        try {
            const modal = (
                <CourseMovementConfirmationModal
                    currentRequirement={currentRequirement}
                    courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionToRequirement={selectionToRequirement}
                    onReturn={value => resolve(value)}
                    onExited={() => {
                        setModals(newModals.filter(value => value !== modal));
                    }}
                />
            )
            const newModals = [...modals, modal];
            setModals(newModals);
        } catch (e) {
            reject(e);
        }
    });
};

export default confirmCourseMovement;