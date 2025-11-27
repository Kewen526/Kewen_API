import { useState } from 'react';
import {
  Card,
  Button,
  Table,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Tag,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { dataSourceApi } from '../api/datasource';

export default function DataSources() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery('datasources', () =>
    dataSourceApi.list({ pageSize: 100 })
  );

  const createMutation = useMutation(dataSourceApi.create, {
    onSuccess: () => {
      message.success('数据源创建成功！');
      setIsModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries('datasources');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => dataSourceApi.update(id, data),
    {
      onSuccess: () => {
        message.success('数据源更新成功！');
        setIsModalOpen(false);
        setEditingId(null);
        form.resetFields();
        queryClient.invalidateQueries('datasources');
      },
    }
  );

  const deleteMutation = useMutation(dataSourceApi.delete, {
    onSuccess: () => {
      message.success('数据源删除成功！');
      queryClient.invalidateQueries('datasources');
    },
  });

  const testMutation = useMutation(dataSourceApi.test, {
    onSuccess: (data: any) => {
      if (data.data.connected) {
        message.success('连接测试成功！');
      } else {
        message.error('连接测试失败！');
      }
      queryClient.invalidateQueries('datasources');
    },
  });

  const handleSubmit = async (values: any) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleTest = (id: string) => {
    testMutation.mutate(id);
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '主机',
      dataIndex: 'host',
      key: 'host',
    },
    {
      title: '端口',
      dataIndex: 'port',
      key: 'port',
    },
    {
      title: '数据库',
      dataIndex: 'database',
      key: 'database',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: any = {
          ACTIVE: { icon: <CheckCircleOutlined />, color: 'success', text: '正常' },
          INACTIVE: { icon: <CloseCircleOutlined />, color: 'default', text: '未激活' },
          ERROR: { icon: <CloseCircleOutlined />, color: 'error', text: '错误' },
        };
        const item = config[status] || config.INACTIVE;
        return (
          <Tag icon={item.icon} color={item.color}>
            {item.text}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<SyncOutlined />}
            onClick={() => handleTest(record.id)}
            loading={testMutation.isLoading}
          >
            测试
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个数据源吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>数据源管理</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingId(null);
            form.resetFields();
            setIsModalOpen(true);
          }}
        >
          创建数据源
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={data?.data || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            total: data?.pagination?.total,
            pageSize: data?.pagination?.pageSize,
            current: data?.pagination?.page,
          }}
        />
      </Card>

      <Modal
        title={editingId ? '编辑数据源' : '创建数据源'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingId(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isLoading || updateMutation.isLoading}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: '请输入数据源名称' }]}
          >
            <Input placeholder="请输入数据源名称" />
          </Form.Item>

          <Form.Item
            label="类型"
            name="type"
            rules={[{ required: true, message: '请选择数据库类型' }]}
          >
            <Select placeholder="请选择数据库类型">
              <Select.Option value="MYSQL">MySQL</Select.Option>
              <Select.Option value="POSTGRESQL">PostgreSQL</Select.Option>
              <Select.Option value="MONGODB">MongoDB</Select.Option>
              <Select.Option value="REDIS">Redis</Select.Option>
              <Select.Option value="SQL_SERVER">SQL Server</Select.Option>
              <Select.Option value="SQLITE">SQLite</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="主机"
            name="host"
            rules={[{ required: true, message: '请输入主机地址' }]}
          >
            <Input placeholder="localhost" />
          </Form.Item>

          <Form.Item
            label="端口"
            name="port"
            rules={[{ required: true, message: '请输入端口号' }]}
          >
            <InputNumber placeholder="3306" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="数据库"
            name="database"
            rules={[{ required: true, message: '请输入数据库名称' }]}
          >
            <Input placeholder="database_name" />
          </Form.Item>

          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="username" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={editingId ? [] : [{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder={editingId ? '不修改请留空' : 'password'} />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <Input.TextArea placeholder="可选的描述信息" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
