/**
 * 创建并渲染一个消息组件
 * @param props - 消息组件的属性
 * 功能描述：该函数动态创建一个消息组件，并将其渲染到文档的<body>部分。
 * 详细流程包括：创建一个<div>容器、生成组件的虚拟节点（vnode），然后使用Vue的render函数将该vnode渲染到创建的<div>容器中，
 * 最后将这个容器添加到<body>元素里。
 */
import { render, h, shallowReactive } from 'vue'
import { type CreateMessageProps, type MessageContext } from './types'
import MessageConstructor from './Message.vue'
import useZIndex from '@/hooks/useZIndex'

// 用于管理消息实例的数组和生成唯一ID的种子
let seed = 1

/**
 * 定义一个空数组 `instances`，用于存储 `MessageContext` 类型的实例。
 *
 * @type {MessageContext[]} - 该数组专门用于存储 `MessageContext` 类型的实例对象。
 */
const instances: MessageContext[] = shallowReactive([])

/**
 * 动态创建并渲染消息组件。
 * @param props - 组件的属性
 */
export const createMessage = (props: CreateMessageProps) => {
  const { nextZIndex } = useZIndex()
  // 为每个消息实例生成唯一ID
  const id = `message_${seed++}`

  // 创建一个<div>容器用于渲染消息组件
  const container = document.createElement('div')

  /**
   * 销毁函数，在消息组件中visible置为false时会触发该函数，用于销毁消息组件。
   */
  const onDestory = () => {
    // 在实例数组中查找并移除当前消息实例
    const idx = instances.findIndex((instance) => instance.id === id)
    if (idx === -1) return
    instances.splice(idx, 1)
    render(null, container) // 清空渲染的组件
  }

  // 手动调用删除，其实就是手动的调整组件中的visible的值
  const manualDestroy = () => {
    const instance = instances.find((instance) => instance.id === id)
    if (instance) {
      instance.vm.exposed!.visible.value = false
    }
  }
  // 合并用户传入的props和销毁函数
  const newProps = { ...props, id, onDestory, zIndex: nextZIndex() }
  // 使用Vue的h函数创建虚拟节点,它包含了组件的各种信息，如组件类型、props等。
  const vnode = h(MessageConstructor, newProps)
  console.log('🚀 ~ createMessage ~ vnode:', vnode)
  // 将虚拟节点渲染到<div>容器
  render(vnode, container)
  // 将渲染好的容器添加到<body>元素
  document.body.appendChild(container.firstElementChild!)

  // 创建并返回一个虚拟节点的组件实例。
  // 通过强制解包 `vnode.component` 来获取对应的组件实例。
  // 通过此方法，我们可以直接访问到组件实例，进而可以对组件进行进一步的操作。
  const vm = vnode.component!
  // 将实例信息保存到数组中
  const instance: MessageContext = {
    id,
    vnode,
    vm,
    props: newProps,
    destory: manualDestroy
  }
  instances.push(instance)
  console.log('🚀 ~ createMessage ~ instances:', instances)
  // 返回实例
  return instance
}

/**
 * 获取最后一个创建的消息组件实例。
 * @returns 最后一个消息组件实例
 */
export const getLastInstance = () => {
  return instances.at(-1)
}

/**
 * 获取指定id的实例之前一个实例的底部偏移量。
 * @param id 要查找的实例的id。
 * @returns 如果找到指定id的实例且该实例之前存在其他实例，则返回之前实例的底部偏移量；否则返回0。
 */
export const getLastBottomOffset = (id: string) => {
  // 在instances数组中查找指定id的实例的索引。
  const idx = instances.findIndex((instance) => instance.id === id)
  console.log('🚀 ~ getLastBottomOffset ~ idx:', id, idx, instances.length, instances)

  // 如果指定id的实例索引小于等于0（即不存在，或为第一个实例），则返回0。
  if (idx <= 0) return 0

  // 获取指定id的实例之前的一个实例。
  const prev = instances[idx - 1]

  // 返回之前实例的底部偏移量。
  return prev.vm.exposed!.bottomOffset.value
}
