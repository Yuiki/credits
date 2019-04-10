import React, { Component, ReactNode } from 'react';
import './App.css';
import courses1 from './courses1.json';
import constraint1 from './constraint1.json';
import { MinMax, C1, P1, isC1, P3, Level, P2, C2, isMinMax } from './Constraint';
import Course, { isCourse } from './Course';

interface ConstraintJSON {
    children: (string | ConstraintJSON | { candidates: ConstraintJSON[] })[];
    title: string;
    subtitle?: string;
    creditsCount: number | MinMax;
}

class ConstraintCreater {
    constructor(readonly map: ReadonlyMap<string, Course>) { }

    getCourse(code: string): Course {
        const course = this.map.get(code);

        if (course === undefined) {
            throw new Error(`科目番号 '${code}' が見つかりません。`);
        }

        return course;
    }

    create(json: ConstraintJSON): C1 {
        return {
            title: json.title,
            subtitle: json.subtitle,
            creditsCount: json.creditsCount,
            children: json.children.map((child): Course | C1 | C2 => {
                if (typeof child === 'string') {
                    return this.getCourse(child);
                } else if ('children' in child) {
                    return this.create(child);
                } else {
                    return {
                        candidates: child.candidates.map(value => {
                            return this.create(value);
                        })
                    }
                }
            })
        }
    }
}

interface AppState {
    c: C1,
    p: P1
}
export default class App extends Component<any, AppState> {
    constructor(props: any) {
        super(props);
        const coursesMap = new Map(courses1.map(value => [value.code, value as Course]));

        const c = new ConstraintCreater(coursesMap).create(constraint1);
        this.state = {
            c,
            p: new P1(c, new Map())
        };
    }

    render() {
        return (
            <div className="App">
                <h1>卒業要件を満たしたい</h1>
                <p>
                    某大学の卒業要件を満たすための履修計画を支援するためのツールです。
                    このツールで得られた結果を利用する場合，<strong>必ずご自身の履修要覧やシラバス，または支援室などで確認されるよう</strong>お願いいたします。
                    </p>
                <ul>
                    <li>各科目の単位数や卒業要件の定義が誤っている可能性があります</li>
                    <li>禁止されている科目の組み合わせが存在する可能性があります</li>
                </ul>
                <P1Editor c={this.state.c} p={this.state.p} open isDisabled={false}
                    onClick={p => {
                        this.setState({ p });
                    }} />
            </div>
        );
    }
}

interface P1EditorProps {
    c: C1,
    p: P1,
    open?: boolean,
    isDisabled: boolean,
    onClick: (p: P1) => void
}
class P1Editor extends Component<P1EditorProps, { open: boolean }> {
    constructor(props: P1EditorProps) {
        super(props);
        this.state = { open: !!props.open };
    }

    render(): ReactNode {
        const candidates: ReactNode[] = [];

        for (const child of this.props.c.children) {
            if (isC1(child)) {
                const p = this.props.p.children.get(child);

                if (p !== undefined && !(p instanceof P1)) {
                    throw new Error();
                }

                candidates.push(<P1Editor c={child} isDisabled={this.props.isDisabled}
                    p={p || new P1(child, new Map())}
                    onClick={
                        p => this.props.onClick(new P1(this.props.c, [...this.props.p.children, [child, p]]))
                    } />);
            } else if (isCourse(child)) {
                const p = this.props.p.children.get(child);

                if (p !== undefined && !(p instanceof P3)) {
                    throw new Error();
                }

                candidates.push(<P3Editor course={child}
                    p={p || new P3(child, Level.none)}
                    isDisabled={this.props.isDisabled}
                    onClick={
                        p => this.props.onClick(new P1(this.props.c, [...this.props.p.children, [child, p]]))
                    } />)
            } else {
                const p = this.props.p.children.get(child);

                if (p !== undefined && !(p instanceof P2)) {
                    throw new Error();
                }

                candidates.push(<P2Editor c={child}
                    p={p || new P2(null, null)}
                    onClick={
                        p => this.props.onClick(new P1(this.props.c, [...this.props.p.children, [child, p]]))
                    } />);
            }
        }

        const max: number = isMinMax(this.props.c.creditsCount) ? this.props.c.creditsCount.max : this.props.c.creditsCount;

        return (
            <div className="planner">
                <div className="planner-header" onClick={() => this.setState({ open: !this.state.open })}>
                    <div className="planner-expand-button">
                        {this.state.open ? '▼' : '▶︎'}
                    </div>
                    <div className="constraint-title">
                        <h1>{this.props.c.title}</h1>
                        {this.props.c.subtitle !== undefined ? (<h2>{this.props.c.subtitle}</h2>) : ""}
                    </div>
                    <div className="constraint-credits-count">
                        <div className="acquired-credits-count">
                            <strong>{this.props.p.creditsCount(Level.acquired, false)}</strong>{
                                this.props.p.creditsCount(Level.acquired, true) > max ?
                                    `(+${
                                    this.props.p.creditsCount(Level.acquired, true) - this.props.p.creditsCount(Level.acquired, false)
                                    })` : ''
                            }
                            修得
                        </div>
                        <div className="registered-credits-count">
                            <strong>{this.props.p.creditsCount(Level.registered, false)}</strong>{
                                this.props.p.creditsCount(Level.registered, true) > max ?
                                    `(+${
                                    this.props.p.creditsCount(Level.registered, true) - this.props.p.creditsCount(Level.registered, false)
                                    })` : ''
                            }
                            履修
                        </div>
                        <div className="required-credits-count">
                            <strong>{
                                isMinMax(this.props.c.creditsCount) ?
                                    `${this.props.c.creditsCount.min}-${this.props.c.creditsCount.max}` :
                                    this.props.c.creditsCount
                            }</strong>
                            必要
                        </div>
                    </div>
                    <P1LevelIndicator level={this.props.p.level} isDisabled={this.props.isDisabled} />
                </div>
                {this.state.open ? (<div className="planner-body">{candidates}</div>) : ''}
            </div>
        );
    }
}

function P2Editor(props: {
    c: C2,
    onClick: (p: P2) => void,
    p: P2
}) {
    return (
        <div className="selector">
            <h1></h1>
            <div className="selector-body">
                {[...props.c.candidates].map(candidate => (
                    <div className="option" data-is-selected={props.p.selected === candidate}>
                        <div onClick={() => props.onClick(new P2(candidate, new P1(candidate, new Map())))} className="option-select-button"></div>
                        <div className="option-contents">
                            <P1Editor c={candidate}
                                onClick={p => props.onClick(new P2(candidate, p))}
                                isDisabled={props.p === undefined || props.p.selected !== candidate}
                                p={props.p.selected === candidate && props.p.child !== null ?
                                    props.p.child :
                                    new P1(candidate, new Map())} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function P3Editor(props: {
    course: Course,
    p: P3,
    isDisabled: boolean,
    onClick: (value: P3) => void
}) {
    return (
        <div className="course" onClick={() => {
            if (props.p.level == Level.acquired) {
                props.onClick(new P3(props.course, Level.none));
            } else if (props.p.level == Level.registered) {
                props.onClick(new P3(props.course, Level.acquired));
            } else {
                props.onClick(new P3(props.course, Level.registered));
            }
        }}
            data-value={props.p.level}
            data-is-disabled={props.isDisabled}>
            <span className="course-code"><code>{props.course.code}</code></span>
            <h1 className="course-title">{props.course.title}</h1>
            <span className="course-credits-count"><strong>{props.course.creditsCount}</strong>単位</span>
            <P3LevelIndicator
                level={props.p.level}
                isDisabled={props.isDisabled} />
        </div>
    );
}

function P1LevelIndicator(props: { level: Level, isDisabled: boolean }) {
    return (
        <div className="p1-level-indicator"
            data-value={props.level}
            data-is-disabled={props.isDisabled}>{
                props.isDisabled ? '不要' :
                    props.level === Level.registered ?
                        '履修OK' :
                        props.level === Level.acquired ?
                            '修得OK' : '不足'
            }</div>
    );
}

function P3LevelIndicator(props: { level: Level, isDisabled: boolean }) {
    return (
        <div className="p3-level-indicator"
            data-value={props.level}
            data-is-disabled={props.isDisabled}>{
                props.isDisabled ? '選択不可' :
                    props.level === Level.registered ?
                        '履修する' :
                        props.level === Level.acquired ?
                            '修得済み' : '履修しない'
            }</div>
    )
}
