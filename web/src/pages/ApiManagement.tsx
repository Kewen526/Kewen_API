import { Card, Button, Table, Space, Tag, Popconfirm, message, Input } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiApi } from '../api/api';

export default function ApiManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery('apis', () =>
    apiApi.list({ pageSize: 100 })
  );

  const deleteMutation = useMutation(apiApi.delete, {
    onSuccess: () => {
      message.success('API 删除成功！');
      queryClient.invalidateQueries('apis');
    },
  });

  const publishMutation = useMutation(apiApi.publish, {
    onSuccess: () => {
      message.success('API 发布成功！');
      queryClient.invalidateQueries('apis');
    },
  });

  const unpublishMutation = useMutation(apiApi.unpublish, {
    onSuccess: () => {
      message.success('API 已下线！');
      queryClient.invalidateQueries('apis');
    },
  });

  const columns = [
    {
      title: 'API 名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
      render: (path: string, record: any) => (
        <span>
          /{record.version}{path}
        </span>
      ),
    },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => {
        const colors: any = {
          GET: 'blue',
          POST: 'green',
          PUT: 'orange',
          DELETE: 'red',
          PATCH: 'purple',
        };
        return <Tag color={colors[method]}>{method}</Tag>;
      },
    },
    {
      title: '数据源',
      dataIndex: ['dataSource', 'name'],
      key: 'dataSource',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: any = {
          PUBLISHED: { color: 'success', text: '已发布' },
          DRAFT: { color: 'warning', text: '草稿' },
          DEPRECATED: { color: 'error', text: '已废弃' },
          ARCHIVED: { color: 'default', text: '已归档' },
        };
        const item = config[status] || { color: 'default', text: status };
        return <Tag color={item.color}>{item.text}</Tag>;
      },
    },
    {
      title: '缓存',
      dataIndex: 'cacheEnabled',
      key: 'cacheEnabled',
      render: (enabled: boolean) =>
        enabled ? <Tag color="green">已启用</Tag> : <Tag>未启用</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/apis/${record.id}`)}
          >
            详情
          </Button>
          {record.status === 'DRAFT' ? (
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => publishMutation.mutate(record.id)}
              loading={publishMutation.isLoading}
            >
              发布
            </Button>
          ) : (
            <Button
              type="link"
              icon={<StopOutlined />}
              onClick={() => unpublishMutation.mutate(record.id)}
              loading={unpublishMutation.isLoading}
            >
              下线
            </Button>
          )}
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/apis/${record.id}/edit`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个 API 吗？"
            onConfirm={() => deleteMutation.mutate(record.id)}
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
        <h2>API 管理</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/apis/create')}
        >
          创建 API
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
    </div>
  );
}
