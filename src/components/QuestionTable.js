import { Table, message, Space, Button, Modal, Popconfirm } from 'antd';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AddQuestion from './AddQuestion';

// 当后端不可用时使用的本地演示数据
const fallbackQuestions = [
    {
        id: '1',
        question: 'React 组件的状态应如何更新？',
        options: ['直接修改 this.state', '使用 setState', '修改 props', '重启浏览器'],
        answer: 'b',
        updateTime: Date.now(),
    },
    {
        id: '2',
        question: 'HTTP 状态码 404 代表什么？',
        options: ['服务器错误', '未授权', '未找到资源', '请求超时'],
        answer: 'c',
        updateTime: Date.now(),
    },
    {
        id: '3',
        question: 'JavaScript 中 const 声明的变量可以重新赋值吗？',
        options: ['可以随意赋值', '不能重新赋值', '仅限字符串可赋值', '仅限数字可赋值'],
        answer: 'b',
        updateTime: Date.now(),
    },
    {
        id: '4',
        question: 'CSS Flex 布局中控制主轴方向的属性是？',
        options: ['align-items', 'justify-content', 'flex-direction', 'flex-grow'],
        answer: 'c',
        updateTime: Date.now(),
    },
    {
        id: '5',
        question: 'Git 命令中用于查看提交历史的是？',
        options: ['git status', 'git log', 'git diff', 'git init'],
        answer: 'b',
        updateTime: Date.now(),
    },
    {
        id: '6',
        question: 'HTTP 请求中常用于提交表单且带请求体的方法是？',
        options: ['GET', 'DELETE', 'POST', 'OPTIONS'],
        answer: 'c',
        updateTime: Date.now(),
    },
    {
        id: '7',
        question: '在 React 中，键值 key 的主要作用是？',
        options: ['控制样式', '提高列表渲染效率并保持元素稳定性', '绑定事件', '设置默认值'],
        answer: 'b',
        updateTime: Date.now(),
    },
    {
        id: '8',
        question: 'ES6 中用于声明块级作用域变量的关键字是？',
        options: ['var', 'let', 'function', 'with'],
        answer: 'b',
        updateTime: Date.now(),
    },
];

const QuestionTable = ({ searchQuery, reloadFlag }) => {
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 5,
        total: 0,
        showSizeChanger: false,
        position: ['bottomLeft'],
    });
    const [loading, setLoading] = useState(false);
    const [editVisible, setEditVisible] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);

    const applyFallback = (page = 1) => {
        setData(fallbackQuestions.map((item) => ({ ...item, key: item.id })));
        setPagination((prev) => ({ ...prev, current: page, total: fallbackQuestions.length }));
    };

    const fetchData = (page = 1, pageSize = 5, query = '') => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const queryTrim = (query || '').trim();
        // 若有搜索关键字，优先走 /findQuestion
        if (queryTrim) {
            const params = new URLSearchParams();
            params.append('keyword', queryTrim);
            axios.get(`http://localhost:8080/findQuestion?${params.toString()}`, {
                validateStatus: () => true,
                headers: { token },
            })
                .then((resp) => {
                    try {
                        if (resp && resp.status === 401) {
                            message.error('未登录或登录已过期');
                            return;
                        }
                        if (!resp || resp.status < 200 || resp.status >= 300) {
                            console.error('QuestionTable: findQuestion non-2xx', resp && resp.status, resp && resp.data);
                            applyFallback(1);
                            return;
                        }
                        const res = resp.data;
                        console.log('QuestionTable: findQuestion response', res);
                        const rowsRaw = (res && (res.data || res.rows || res.qsBeanList)) || [];
                        const rows = Array.isArray(rowsRaw) ? rowsRaw : [];
                        setData(rows.map((item) => ({
                            key: item.id || item.qid || item.questionId || item._id,
                            id: item.id || item.qid || item.questionId || item._id,
                            question: item.question || item.title || item.stem || item.content || item.questionText,
                            options: Array.isArray(item.options)
                                ? item.options
                                : (typeof item.options === 'string'
                                    ? item.options.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
                                    : [item.optionA, item.optionB, item.optionC, item.optionD].filter(Boolean)),
                            answer: item.answer || item.correctAnswer || item.rightAnswer,
                            updateTime: item.updateTime,
                        })));
                        setPagination((prev) => ({
                            ...prev,
                            current: 1,
                            pageSize,
                            total: rows.length,
                        }));
                    } catch (err) {
                        console.error('QuestionTable: findQuestion parse error', err);
                        applyFallback(1);
                    }
                })
                .catch((err) => {
                    console.error('QuestionTable: findQuestion fetch error', err);
                    applyFallback(1);
                })
                .finally(() => setLoading(false));
            return;
        }

        // 无关键字时走分页列表 /questions
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('pageSize', pageSize);

        axios.get(`http://localhost:8080/questions?${params.toString()}`, {
            validateStatus: () => true,
            headers: { token },
        })
            .then((resp) => {
                try {
                    if (resp && resp.status === 401) {
                        message.error('未登录或登录已过期');
                        return;
                    }
                    if (!resp || resp.status < 200 || resp.status >= 300) {
                        console.error('QuestionTable: non-2xx status', resp && resp.status, resp && resp.data);
                        applyFallback(page);
                        return;
                    }
                    const res = resp.data;
                    console.log('QuestionTable: backend response', res);
                    const rowsRaw = (res && (
                        res.rows ||
                        (res.data && (res.data.rows || res.data.data || res.data.items || res.data.qsBeanList)) ||
                        res.data ||
                        res.qsBeanList
                    )) || [];
                    const rows = Array.isArray(rowsRaw) ? rowsRaw : [];
                    console.log('QuestionTable: rows length', rows.length, 'sample', rows[0]);
                    const totalFromServer = (res && (res.total || (res.data && res.data.total))) || rows.length;
                    setData(rows.map((item) => ({
                        key: item.id || item.qid || item.questionId || item._id,
                        id: item.id || item.qid || item.questionId || item._id,
                        question: item.question || item.title || item.stem || item.content || item.questionText,
                        options: Array.isArray(item.options)
                            ? item.options
                            : (typeof item.options === 'string'
                                ? item.options.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
                                : [item.optionA, item.optionB, item.optionC, item.optionD].filter(Boolean)),
                        answer: item.answer || item.correctAnswer || item.rightAnswer,
                        updateTime: item.updateTime,
                    })));
                    setPagination((prev) => ({
                        ...prev,
                        current: page,
                        pageSize,
                        total: totalFromServer,
                    }));
                } catch (err) {
                    console.error('QuestionTable: parse error', err);
                    applyFallback(page);
                }
            })
            .catch((err) => {
                console.error('QuestionTable: fetch error', err);
                applyFallback(page);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchData(1, pagination.pageSize, searchQuery || '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, reloadFlag]);

    const handleTableChange = (pag) => {
        fetchData(pag.current, pag.pageSize, searchQuery || '');
    };

    const columns = [
        {
            title: '序号',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: '题目',
            dataIndex: 'question',
            key: 'question',
        },
        {
            title: '选项',
            dataIndex: 'options',
            key: 'options',
            render: (options) => Array.isArray(options) ? options.join(', ') : '',
        },
        {
            title: '答案',
            dataIndex: 'answer',
            key: 'answer',
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button type="link" onClick={() => {
                        setEditingRecord(record);
                        setEditVisible(true);
                    }}>编辑</Button>
                    <Popconfirm
                        title="确认删除该题目？"
                        okText="删除"
                        cancelText="取消"
                        onConfirm={() => {
                            const token = localStorage.getItem('token');
                            axios.get(`http://localhost:8080/delQuestion?id=${record.id}` , { headers: { token } })
                                .then((resp) => {
                                    const data = resp && resp.data;
                                    if (resp && resp.status === 401) {
                                        message.error('未登录或登录已过期');
                                        return;
                                    }
                                    const success = resp && resp.status >= 200 && resp.status < 300 && data && data.code === 1;
                                    if (success) {
                                        message.success('删除成功');
                                        fetchData(pagination.current, pagination.pageSize, searchQuery || '');
                                    } else {
                                        message.error((data && data.msg) || '删除失败');
                                    }
                                })
                                .catch((err) => {
                                    console.error('QuestionTable: delete error', err);
                                    message.error('删除失败');
                                });
                        }}
                    >
                        <Button type="link" danger>删除</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <>
            <Table
                columns={columns}
                dataSource={data}
                pagination={pagination}
                loading={loading}
                onChange={handleTableChange}
            />
            <Modal
                title="编辑题目"
                open={editVisible}
                footer={null}
                destroyOnClose
                onCancel={() => {
                    setEditVisible(false);
                    setEditingRecord(null);
                }}
            >
                <AddQuestion
                    mode="edit"
                    initialValues={editingRecord || {}}
                    onSubmitted={() => {
                        setEditVisible(false);
                        setEditingRecord(null);
                        fetchData(pagination.current, pagination.pageSize, searchQuery || '');
                    }}
                />
            </Modal>
        </>
    );
};

export default QuestionTable;