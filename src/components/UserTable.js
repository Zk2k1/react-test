import { Space, Table, Modal, Form, Input, Button, Popconfirm, message } from 'antd';
import React from 'react';
import axios from 'axios';

import {useState, useEffect} from 'react';

// 当后端不可用时的本地示例用户数据
const fallbackUsers = [
    { id: 1, userName: 'alice', updateTime: Date.now() },
    { id: 2, userName: 'bob', updateTime: Date.now() - 1000 * 60 * 60 },
    { id: 3, userName: 'charlie', updateTime: Date.now() - 1000 * 60 * 60 * 2 },
    { id: 4, userName: 'diana', updateTime: Date.now() - 1000 * 60 * 60 * 3 },
    { id: 5, userName: 'eve', updateTime: Date.now() - 1000 * 60 * 60 * 4 },
    { id: 6, userName: 'frank', updateTime: Date.now() - 1000 * 60 * 60 * 5 },
    { id: 7, userName: 'grace', updateTime: Date.now() - 1000 * 60 * 60 * 6 },
    { id: 8, userName: 'henry', updateTime: Date.now() - 1000 * 60 * 60 * 7 },
];

const onChange = (pagination, filters, sorter, extra) => {
    console.log('params', pagination, filters, sorter, extra);
};

const UserTable = ({ searchQuery, reloadFlag }) => {
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
    const [editingUser, setEditingUser] = useState(null);
    const [editForm] = Form.useForm();

    const applyFallback = (page = 1, pageSize = 5, query = '') => {
        const keyword = (query || '').trim().toLowerCase();
        const filtered = keyword
            ? fallbackUsers.filter((u) => (u.userName || '').toLowerCase().includes(keyword))
            : fallbackUsers;
        setData(filtered.map((item) => ({
            key: item.id,
            id: item.id,
            userName: item.userName,
            updateTime: item.updateTime,
        })));
        setPagination((prev) => ({
            ...prev,
            current: page,
            pageSize: pageSize,
            total: filtered.length,
        }));
    };

    const handleEditClick = (record) => {
        setEditingUser(record);
        editForm.setFieldsValue({
            username: record.userName,
            password: '',
            confirm: '',
        });
        setEditVisible(true);
    };

    const handleEditSubmit = () => {
        editForm.validateFields().then((values) => {
            const payload = {
                old_username: editingUser.userName,
                username: values.username,
                password: values.password,
                checkpassword: values.confirm,
            };
            axios.post('http://localhost:8080/updateUser', payload)
                .then((resp) => {
                    const data = resp && resp.data;
                    console.log('UserTable: updateUser response', data);
                    if (data && data.code === 1) {
                        message.success('编辑成功');
                        setEditVisible(false);
                        fetchData(pagination.current, pagination.pageSize, searchQuery || '');
                    } else {
                        message.error((data && data.msg) || '编辑失败');
                    }
                })
                .catch((err) => {
                    console.error('UserTable: updateUser error', err);
                    message.error('编辑请求失败');
                });
        });
    };

    const handleDelete = (record) => {
        axios.get('http://localhost:8080/deleteById', { params: { id: record.id } })
            .then((resp) => {
                const data = resp && resp.data;
                console.log('UserTable: delete response', data);
                if (data && data.code === 1) {
                    message.success('删除成功');
                    fetchData(pagination.current, pagination.pageSize, searchQuery || '');
                } else {
                    message.error((data && data.msg) || '删除失败');
                }
            })
            .catch((err) => {
                console.error('UserTable: delete error', err);
                message.error('删除请求失败');
            });
    };

    const columns = [
        {
            title: '序号',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: '用户名',
            dataIndex: 'userName',
            key: 'userName',
        },
        {
            title: '日期',
            dataIndex: 'updateTime',
            key: 'updateTime',
            render: (text) => text ? new Date(text).toLocaleString() : '',
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="link" onClick={() => handleEditClick(record)}>编辑</Button>
                    <Popconfirm
                        title="确认删除该用户吗？"
                        okText="删除"
                        cancelText="取消"
                        onConfirm={() => handleDelete(record)}
                    >
                        <Button type="link" danger>删除</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const fetchData = (page = 1, pageSize = 5, query = '') => {
        console.log('UserTable: fetchData called', { page, pageSize, query });
        setLoading(true);
        const token = localStorage.getItem('token');
        // 构建查询参数，包含分页与可选的用户名查询
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('pageSize', pageSize);
        if (query && query.trim() !== '') {
            params.append('userName', query.trim());
        }

        axios
            .get(`http://localhost:8080/users?${params.toString()}`,{
                headers: {
                    token: token
                }
            })
            .then((response) => {
                const res = response.data;
                console.log('UserTable: backend response', res);
                if (response && response.status === 401) {
                    message.error('未登录或登录已过期');
                    return;
                }
                if (!response || response.status < 200 || response.status >= 300) {
                    console.error('UserTable: non-2xx', response && response.status, res);
                    applyFallback(page, pageSize, query);
                    return;
                }
                // 支持多种常见返回形态：res.data.row | res.data.rows | res.data.data
                const rows = (res && (res.row || res.rows || (res.data && (res.data.row || res.data.rows)))) || [];
                console.log('UserTable: raw rows length', rows.length);
                // 如果有查询，优先在客户端做备援过滤（后端可能不支持或参数名不同）
                const effectiveRows = (query && query.trim() !== '')
                    ? rows.filter((item) => (item.userName || '').toLowerCase().includes(query.trim().toLowerCase()))
                    : rows;
                console.log('UserTable: effective rows length', effectiveRows.length);
                const totalFromServer = (res && (res.total || (res.data && res.data.total)));
                const total = (query && query.trim() !== '') ? effectiveRows.length : (totalFromServer || effectiveRows.length);
                setData(effectiveRows.map((item) => ({
                    key: item.id,
                    id: item.id,
                    userName: item.userName,
                    updateTime: item.updateTime,
                })));
                setPagination((prev) => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize,
                    total: total,
                }));
            })
            .catch((error) => {
                console.error("Error fetching users:", error);
                applyFallback(page, pageSize, query);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // 初次加载 & 当 searchQuery 改变时，重载第 1 页的数据
    useEffect(() => {
        // 当 searchQuery 或 reloadFlag 变化时，重载第 1 页的数据
        fetchData(1, pagination.pageSize, searchQuery || '');
    }, [searchQuery, reloadFlag]);

    const handleTableChange = (pag) => {
        fetchData(pag.current, pag.pageSize, searchQuery || '');
    };

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
                title="编辑用户"
                open={editVisible}
                onOk={handleEditSubmit}
                onCancel={() => setEditVisible(false)}
                okText="保存"
                cancelText="取消"
                destroyOnClose
            >
                <Form form={editForm} layout="vertical" preserve={false}>
                    <Form.Item
                        name="username"
                        label="用户名"
                        rules={[{ required: true, message: '请输入用户名' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="密码"
                        rules={[{ required: true, message: '请输入密码' }]}
                        hasFeedback
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item
                        name="confirm"
                        label="确认密码"
                        dependencies={['password']}
                        hasFeedback
                        rules={[
                            { required: true, message: '请再次输入密码' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('两次密码不一致'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};
export default UserTable;